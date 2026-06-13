CREATE TABLE IF NOT EXISTS AccountRequest (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  computing_id VARCHAR(32) NOT NULL,
  council_year_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  requested_role VARCHAR(80),
  requested_committee_name VARCHAR(120),
  request_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  INDEX idx_account_request_status_requested (request_status, requested_at),
  INDEX idx_account_request_computing_status (computing_id, request_status),
  INDEX idx_account_request_email_status (email, request_status),
  CONSTRAINT fk_account_request_year
    FOREIGN KEY (council_year_id) REFERENCES CouncilYear(council_year_id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
