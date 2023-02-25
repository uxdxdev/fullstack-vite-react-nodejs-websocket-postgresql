import { useEffect, useState } from "react";
import io from "socket.io-client";
import "./App.css";
import {
  Cell,
  Row,
  Column,
  TableBody,
  TableHeader,
  TableView,
  TextField,
  ActionButton,
} from "@adobe/react-spectrum";
let socket = null;

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [dueReminders, setDueReminders] = useState([]);
  const [reminderText, setReminderText] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");

  const sortReminders = (a, b) => {
    if (a.time < b.time) return -1;
    else if (a.time > b.time) return 1;
    else return 0;
  };

  useEffect(() => {
    if (username) {
      async function fetchReminders() {
        await fetch(
          "http://localhost:4000/reminders?" + new URLSearchParams({ username })
        )
          .then((res) => res.json())
          .then((data) => {
            setReminders(data);
          });
      }
      fetchReminders();
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      if (socket) socket.disconnect();
      socket = io("http://localhost:4000");
      socket.on("connect", () => {
        setIsConnected(true);
        socket.emit("register", username);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("alerts", (alerts) => {
        setDueReminders(alerts.sort(sortReminders));
      });

      socket.on("reminders", (reminders) => {
        setReminders(reminders.sort(sortReminders));
      });
    }

    return () => {
      socket?.off("connect");
      socket?.off("disconnect");
      socket?.off("alerts");
      socket?.off("reminders");
    };
  }, [username]);

  const handleAddReminder = () => {
    const now = new Date();
    const nowDate = now.toISOString().split("T")[0];
    const utcTime = new Date(nowDate + "T" + reminderTime).toUTCString();
    if (
      username &&
      reminderText &&
      reminderTime &&
      utcTime !== "Invalid Date"
    ) {
      const data = {
        username,
        message: reminderText,
        time: utcTime,
      };

      socket.emit("createReminder", data);
      setReminderText("");
      setReminderTime("");
    } else {
      console.error("reminder not correct format");
    }
  };

  return (
    <div className="App">
      <TextField
        id="username"
        aria-label="username"
        onChange={setUsernameInput}
        value={usernameInput}
      />
      <ActionButton
        onPress={() => {
          if (username !== usernameInput) {
            setDueReminders([]);
            setReminders([]);
            setUsername(usernameInput);
          }
        }}
      >
        Login
      </ActionButton>
      <p>Connected: {"" + isConnected}</p>
      {!isConnected ? (
        <div>Set username</div>
      ) : (
        <>
          <p>Alerts</p>
          <TableView
            aria-label="Alerts table"
            onAction={(key) => alert(key + JSON.stringify(dueReminders[key]))}
          >
            <TableHeader
              columns={[
                {
                  name: "Message",
                  uid: "message",
                },
                {
                  name: "Time",
                  uid: "time",
                },
              ]}
            >
              {(column) => <Column key={column.uid}>{column.name}</Column>}
            </TableHeader>
            <TableBody items={dueReminders}>
              {(item) => (
                <Row>{(columnKey) => <Cell>{item[columnKey]}</Cell>}</Row>
              )}
            </TableBody>
          </TableView>

          <div>
            <TextField
              id="message"
              aria-label="message"
              onChange={setReminderText}
              value={reminderText}
            />
            <TextField
              id="time"
              aria-label="time"
              onChange={setReminderTime}
              value={reminderTime}
            />
            <ActionButton
              onPress={() => {
                handleAddReminder();
              }}
            >
              Add reminder
            </ActionButton>
          </div>
          <p>Reminders</p>

          <TableView aria-label="Reminders table">
            <TableHeader
              columns={[
                {
                  name: "Message",
                  uid: "message",
                },
                {
                  name: "Time",
                  uid: "time",
                },
              ]}
            >
              {(column) => <Column key={column.uid}>{column.name}</Column>}
            </TableHeader>
            <TableBody items={reminders}>
              {(item) => (
                <Row>{(columnKey) => <Cell>{item[columnKey]}</Cell>}</Row>
              )}
            </TableBody>
          </TableView>
        </>
      )}
    </div>
  );
}

export default App;
