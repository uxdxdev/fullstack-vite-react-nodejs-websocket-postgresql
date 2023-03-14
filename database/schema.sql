DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL
);

DROP TABLE IF EXISTS reminders;

CREATE TABLE IF NOT EXISTS reminders (
  reminder_id serial PRIMARY KEY,
  owner_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  time VARCHAR(255) NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users (user_id)
);

INSERT INTO users (username) VALUES ('mortond');
INSERT INTO users (username) VALUES ('ted');