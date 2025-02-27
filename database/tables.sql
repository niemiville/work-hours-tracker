CREATE TABLE timeentry (
    id SERIAL PRIMARY KEY,
    userid INT NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP,
    date DATE NOT NULL,
    tasktype VARCHAR(50) NOT NULL,
    taskid INT NOT NULL,
    description TEXT,
    hours DECIMAL(5,2) NOT NULL
);
