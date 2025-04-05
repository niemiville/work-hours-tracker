CREATE TABLE timeentry (
    id SERIAL PRIMARY KEY,
    userid INT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP,
    date DATE NOT NULL,
    tasktype VARCHAR(50) NOT NULL,
    taskid INT,
    subtaskid INT,
    description TEXT,
    hours DECIMAL(5,2) NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    displayname VARCHAR(100),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP
);

ALTER TABLE timeentry ALTER COLUMN taskid DROP NOT NULL;
ALTER TABLE users ADD COLUMN displayname VARCHAR(100);
ALTER TABLE timeentry ADD COLUMN subtaskid INT;