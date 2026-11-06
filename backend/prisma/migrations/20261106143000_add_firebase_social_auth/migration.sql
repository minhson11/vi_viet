ALTER TABLE `users`
  ADD COLUMN `firebase_uid` VARCHAR(128) NULL;

CREATE UNIQUE INDEX `uq_users_firebase_uid`
  ON `users`(`firebase_uid`);
