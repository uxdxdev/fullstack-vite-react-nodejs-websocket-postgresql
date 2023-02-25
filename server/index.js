import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import pg from "pg";

const PORT = 4000;
const app = express();
const server = http.Server(app);
const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "reminders",
  password: "admin",
  port: 5432,
});

app.use(cors());

app.get("/reminders", (request, response) => {
  const username = request.query.username;
  pool.query(
    "SELECT * FROM reminders WHERE owner_id=(SELECT user_id FROM users WHERE username=$1)",
    [username],
    (error, results) => {
      if (error) {
        console.error(error);
      }

      const data = results.rows.filter((item) => {
        const { time } = item;
        const reminderTime = new Date(time);
        const now = new Date();
        return reminderTime > now;
      });

      response
        .status(200)
        .json(data.map((result) => ({ ...result, id: result.reminder_id })));
    }
  );
});

const socket = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const sockets = {};

socket.on("connection", (socket) => {
  console.log("user connected " + socket.id);

  socket.on("register", (username) => {
    sockets[username] = {
      ...sockets[username],
      socket,
      alerts: [],
      reminders: [],
    };
    console.log(`user registered ${username}`);
  });

  socket.on("createReminder", (data) => {
    const { username, message, time } = data;
    if ((username, message && time)) {
      pool.query(
        `INSERT INTO reminders (owner_id, message, time) VALUES ((SELECT user_id FROM users WHERE username=$1), $2, $3)`,
        [username, message, time],
        (error, results) => {
          if (error) {
            console.error(error);
          }
          console.log(`reminder created`);
        }
      );
    } else {
      console.log("no message or time");
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnect " + socket.id);
  });
});

setInterval(() => {
  pool.query("SELECT * FROM reminders", (error, results) => {
    if (error) {
      console.error(error);
    }
    results.rows.map(async (reminder) => {
      const { owner_id, time } = reminder;
      const { username } = await new Promise((resolve, reject) => {
        pool.query(
          "SELECT username FROM users WHERE user_id=$1",
          [owner_id],
          (error, results) => {
            if (error) reject(error);
            resolve(results.rows[0]);
          }
        );
      });
      const reminderTime = new Date(time);
      const now = new Date();
      if (reminderTime < now) {
        if (sockets[username]) {
          sockets[username].alerts.push({
            ...reminder,
            id: reminder.reminder_id,
          });
        }
      } else {
        if (sockets[username]) {
          sockets[username].reminders.push({
            ...reminder,
            id: reminder.reminder_id,
          });
        }
      }
    });

    Object.keys(sockets).forEach((username) => {
      if (sockets[username].alerts.length) {
        sockets[username].socket.emit("alerts", sockets[username].alerts);
        sockets[username].alerts = [];
      }
      if (sockets[username].reminders.length) {
        sockets[username].socket.emit("reminders", sockets[username].reminders);
        sockets[username].reminders = [];
      }
    });
  });
}, 3000);

server.listen(PORT, () => {
  console.log(`server listening on ${PORT}`);
});
