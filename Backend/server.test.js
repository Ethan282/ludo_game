const request = require('supertest');

describe('Ludo Backend', () => {
  let server;

  beforeAll((done) => {
    process.env.NODE_ENV = 'test';
    const mod = require('./server.js');
    server = mod.server;
    server.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('HTTP Server', () => {
    it('should respond to GET /health with 200 and status ok', async () => {
      const res = await request(server).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('should handle CORS headers', async () => {
      const res = await request(server).get('/health');
      expect(res.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Socket.io', () => {
    const { Server } = require('socket.io');
    const io = require('socket.io-client');

    let client;
    let serverIo;

    beforeAll((done) => {
      const mod = require('./server.js');
      serverIo = mod.io;
      done();
    });

    afterEach((done) => {
      if (client) {
        client.disconnect();
        client = null;
      }
      done();
    });

    it('should handle client connection', (done) => {
      client = io(`http://localhost:${server.address().port}`);
      client.on('connect', () => {
        expect(client.connected).toBe(true);
        done();
      });
    });

    it('should create a room', (done) => {
      client = io(`http://localhost:${server.address().port}`);
      client.on('connect', () => {
        client.emit('create_room', 'Test Player');
        client.on('room_created', (data) => {
          expect(typeof data.code).toBe('string');
          expect(data.code.length).toBe(4);
          expect(data.color).toBe('green');
          expect(Array.isArray(data.players)).toBe(true);
          done();
        });
      });
    });

    it('should handle join_room with invalid code', (done) => {
      client = io(`http://localhost:${server.address().port}`);
      client.on('connect', () => {
        client.emit('join_room', 'XXXX');
        client.on('join_error', (msg) => {
          expect(msg).toBe('Invalid room code.');
          done();
        });
      });
    });

    it('should start game when 4 players join', (done) => {
      const clients = [];
      let createdCode = null;
      let joinedCount = 0;
      let gotGameStart = false;
      let gotTurnChange = false;

      const tryDone = () => {
        if (gotGameStart && gotTurnChange) {
          clients.forEach((c) => c.disconnect());
          done();
        }
      };

      // Set up listeners on client 0 first
      const client0 = io(`http://localhost:${server.address().port}`);
      clients.push(client0);
      client0.on('connect', () => {
        client0.emit('create_room', 'Host');
        client0.on('room_created', (data) => {
          createdCode = data.code;
        });
        client0.on('game_start', () => { gotGameStart = true; tryDone(); });
        client0.on('turn_change', (data) => {
          gotTurnChange = true;
          expect(['green', 'yellow', 'blue', 'red']).toContain(data.turn);
          tryDone();
        });
      });

      // Other clients wait for room code then join
      for (let i = 1; i < 4; i++) {
        const c = io(`http://localhost:${server.address().port}`);
        clients.push(c);
        c.on('connect', () => {
          const tryJoin = () => {
            if (!createdCode) { setTimeout(tryJoin, 50); return; }
            c.emit('join_room', createdCode, `Player ${i}`);
            c.on('room_joined', () => {
              joinedCount++;
            });
            c.on('join_error', (msg) => {
              if (msg === 'Invalid room code.') setTimeout(tryJoin, 50);
            });
          };
          tryJoin();
        });
      }

      setTimeout(() => {
        clients.forEach((c) => c.disconnect());
        if (!gotGameStart || !gotTurnChange) done(new Error('Timeout waiting for game events'));
      }, 10000);
    });

    it('should start game with 2 players when host triggers start_game', (done) => {
      const clients = [];
      let roomCode = null;
      let hostClient = io(`http://localhost:${server.address().port}`);
      let player2Client = io(`http://localhost:${server.address().port}`);
      clients.push(hostClient, player2Client);

      let hostGotStart = false;
      let p2GotStart = false;

      const checkBoth = () => {
        if (hostGotStart && p2GotStart) {
          clients.forEach(c => c.disconnect());
          done();
        }
      };

      hostClient.on('connect', () => {
        hostClient.emit('create_room', 'Host2P');
        hostClient.on('room_created', (data) => {
          roomCode = data.code;
          player2Client.emit('join_room', roomCode, 'Guest2P');
        });
      });

      player2Client.on('room_joined', () => {
        hostClient.emit('start_game', roomCode);
      });

      hostClient.on('game_start', (data) => {
        expect(data.players.length).toBe(4);
        expect(data.players[0].color).toBe('green');
        expect(data.players[1].color).toBe('yellow');
        expect(data.players[2].isCpu).toBe(true);
        expect(data.players[3].isCpu).toBe(true);
        hostGotStart = true;
        checkBoth();
      });

      player2Client.on('game_start', (data) => {
        expect(data.players.length).toBe(4);
        p2GotStart = true;
        checkBoth();
      });
    });

    it('should start game with 3 players and 1 CPU when host triggers start_game', (done) => {
      const clients = [];
      let roomCode = null;
      let c1 = io(`http://localhost:${server.address().port}`);
      let c2 = io(`http://localhost:${server.address().port}`);
      let c3 = io(`http://localhost:${server.address().port}`);
      clients.push(c1, c2, c3);

      c1.on('connect', () => {
        c1.emit('create_room', 'Host3P');
        c1.on('room_created', (data) => {
          roomCode = data.code;
          c2.emit('join_room', roomCode, 'Guest2');
        });
      });

      c2.on('room_joined', () => {
        c3.emit('join_room', roomCode, 'Guest3');
      });

      c3.on('room_joined', () => {
        c1.emit('start_game', roomCode);
      });

      c1.on('game_start', (data) => {
        expect(data.players.length).toBe(4);
        expect(data.players.map(p => p.color)).toEqual(['green', 'yellow', 'blue', 'red']);
        expect(data.players[3].isCpu).toBe(true);
        clients.forEach(c => c.disconnect());
        done();
      });
    });
  });
});
