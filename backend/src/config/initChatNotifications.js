import pool from "./db.js";

export const initializeChatNotificationsTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.chat_messages (
      id_message SERIAL PRIMARY KEY,
      sender_id BIGINT NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
      receiver_id BIGINT NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
      message TEXT NOT NULL,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE flix.chat_messages
      ALTER COLUMN sender_id TYPE BIGINT USING sender_id::BIGINT,
      ALTER COLUMN receiver_id TYPE BIGINT USING receiver_id::BIGINT
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_receiver
    ON flix.chat_messages (sender_id, receiver_id, created_at)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_read
    ON flix.chat_messages (receiver_id, read_at)
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS flix.notifications (
      id_notification SERIAL PRIMARY KEY,
      id_user BIGINT NOT NULL REFERENCES flix.users(id_user) ON DELETE CASCADE,
      title VARCHAR(160) NOT NULL,
      message TEXT NOT NULL,
      link_url VARCHAR(255),
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE flix.notifications
      ALTER COLUMN id_user TYPE BIGINT USING id_user::BIGINT
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON flix.notifications (id_user, read_at, created_at DESC)
  `);
};
