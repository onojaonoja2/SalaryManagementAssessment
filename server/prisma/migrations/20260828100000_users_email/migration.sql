-- The login identifier is now the user's email. Rename the unique column
-- users.username -> users.email (the unique index is preserved by MySQL).
ALTER TABLE `users` CHANGE `username` `email` VARCHAR(191) NOT NULL;
