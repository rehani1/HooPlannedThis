CREATE TABLE IF NOT EXISTS Advisor (
  advisor_id INT AUTO_INCREMENT PRIMARY KEY,
  advisor_first_name VARCHAR(100) NOT NULL,
  advisor_last_name VARCHAR(100) NOT NULL,
  advisor_phone VARCHAR(40),
  advisor_email VARCHAR(255),
  building_name VARCHAR(255),
  address VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS CouncilYear (
  council_year_id INT AUTO_INCREMENT PRIMARY KEY,
  grad_year INT NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  class_name VARCHAR(80) NOT NULL,
  advisor_id INT,
  UNIQUE KEY uq_council_year_grad_academic (grad_year, academic_year),
  CONSTRAINT fk_council_year_advisor
    FOREIGN KEY (advisor_id) REFERENCES Advisor(advisor_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS CouncilBudget (
  council_year_id INT PRIMARY KEY,
  budget_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_council_budget_year
    FOREIGN KEY (council_year_id) REFERENCES CouncilYear(council_year_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Committee (
  committee_id INT AUTO_INCREMENT PRIMARY KEY,
  council_year_id INT NOT NULL,
  committee_name VARCHAR(120) NOT NULL,
  budget_allocated DECIMAL(12,2) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_committee_year_name (council_year_id, committee_name),
  CONSTRAINT fk_committee_year
    FOREIGN KEY (council_year_id) REFERENCES CouncilYear(council_year_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS CouncilMember (
  computing_id VARCHAR(32) PRIMARY KEY,
  council_year_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  bio TEXT,
  photo_url VARCHAR(500),
  password_hash VARCHAR(255) NOT NULL,
  created_account_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_council_member_email (email),
  CONSTRAINT fk_council_member_year
    FOREIGN KEY (council_year_id) REFERENCES CouncilYear(council_year_id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

CREATE TABLE IF NOT EXISTS CommitteeMembership (
  computing_id VARCHAR(32) NOT NULL,
  committee_id INT NOT NULL,
  membership_role VARCHAR(80),
  start_date DATE,
  end_date DATE,
  PRIMARY KEY (computing_id, committee_id),
  CONSTRAINT fk_committee_membership_member
    FOREIGN KEY (computing_id) REFERENCES CouncilMember(computing_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_committee_membership_committee
    FOREIGN KEY (committee_id) REFERENCES Committee(committee_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ExecutivePosition (
  executive_position_id INT AUTO_INCREMENT PRIMARY KEY,
  computing_id VARCHAR(32) NOT NULL,
  council_year_id INT NOT NULL,
  role VARCHAR(80) NOT NULL,
  CONSTRAINT fk_executive_position_member
    FOREIGN KEY (computing_id) REFERENCES CouncilMember(computing_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_executive_position_year
    FOREIGN KEY (council_year_id) REFERENCES CouncilYear(council_year_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Location (
  location_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(120),
  state VARCHAR(80),
  zipcode VARCHAR(20),
  venue_email VARCHAR(255),
  venue_phone VARCHAR(40)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS CouncilEvent (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  committee_id INT NOT NULL,
  location_id INT,
  created_by VARCHAR(32),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  budget_allocated DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'planned',
  volunteer_slots INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_council_event_committee
    FOREIGN KEY (committee_id) REFERENCES Committee(committee_id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_council_event_location
    FOREIGN KEY (location_id) REFERENCES Location(location_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_council_event_creator
    FOREIGN KEY (created_by) REFERENCES CouncilMember(computing_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS EventContact (
  event_id INT NOT NULL,
  computing_id VARCHAR(32) NOT NULL,
  contact_role VARCHAR(80),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (event_id, computing_id),
  CONSTRAINT fk_event_contact_event
    FOREIGN KEY (event_id) REFERENCES CouncilEvent(event_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_event_contact_member
    FOREIGN KEY (computing_id) REFERENCES CouncilMember(computing_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS VolunteerSignup (
  volunteer_signup_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  computing_id VARCHAR(32) NOT NULL,
  volunteer_role VARCHAR(80),
  shift_start DATETIME,
  shift_end DATETIME,
  signup_status VARCHAR(40) NOT NULL DEFAULT 'signed_up',
  CONSTRAINT fk_volunteer_signup_event
    FOREIGN KEY (event_id) REFERENCES CouncilEvent(event_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_volunteer_signup_member
    FOREIGN KEY (computing_id) REFERENCES CouncilMember(computing_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Supply (
  supply_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  stock_qty INT NOT NULL DEFAULT 0,
  default_unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  reusable BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS EventSupply (
  event_id INT NOT NULL,
  supply_id INT NOT NULL,
  quantity_needed INT NOT NULL DEFAULT 0,
  quantity_used INT NOT NULL DEFAULT 0,
  quantity_returned INT NOT NULL DEFAULT 0,
  unit_cost_at_time DECIMAL(12,2) NOT NULL DEFAULT 0,
  return_needed BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  PRIMARY KEY (event_id, supply_id),
  CONSTRAINT fk_event_supply_event
    FOREIGN KEY (event_id) REFERENCES CouncilEvent(event_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_event_supply_supply
    FOREIGN KEY (supply_id) REFERENCES Supply(supply_id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Vendor (
  vendor_id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  contact_address VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(40),
  UNIQUE KEY uq_vendor_company_name (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS VendorSupply (
  vendor_id INT NOT NULL,
  supply_id INT NOT NULL,
  vendor_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  product_link VARCHAR(500),
  preferred_vendor BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (vendor_id, supply_id),
  CONSTRAINT fk_vendor_supply_vendor
    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_vendor_supply_supply
    FOREIGN KEY (supply_id) REFERENCES Supply(supply_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS EventExpense (
  expense_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  vendor_id INT,
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  category VARCHAR(80),
  description TEXT,
  receipt_url VARCHAR(500),
  CONSTRAINT fk_event_expense_event
    FOREIGN KEY (event_id) REFERENCES CouncilEvent(event_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_event_expense_vendor
    FOREIGN KEY (vendor_id) REFERENCES Vendor(vendor_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS Advertisement (
  advertisement_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  created_by VARCHAR(32),
  platform VARCHAR(80),
  advertisement_type VARCHAR(80),
  content_link VARCHAR(500),
  scheduled_post_date DATE,
  actual_post_date DATE,
  status VARCHAR(40) NOT NULL DEFAULT 'planned',
  CONSTRAINT fk_advertisement_event
    FOREIGN KEY (event_id) REFERENCES CouncilEvent(event_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_advertisement_creator
    FOREIGN KEY (created_by) REFERENCES CouncilMember(computing_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS EventDocument (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  uploaded_by VARCHAR(32),
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(80),
  file_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_document_event
    FOREIGN KEY (event_id) REFERENCES CouncilEvent(event_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_event_document_uploader
    FOREIGN KEY (uploaded_by) REFERENCES CouncilMember(computing_id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
