-- ==========================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS (DDL)
-- Sistema: OnBoardHub (SaaS Multi-tenant)
-- Motor: PostgreSQL
-- ==========================================

CREATE TABLE companies (
	name VARCHAR(255) NOT NULL, 
	tax_id VARCHAR(20) NOT NULL, 
	status BOOLEAN, 
	domain VARCHAR(100), 
	location VARCHAR(255), 
	id SERIAL NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	UNIQUE (domain)
);

CREATE INDEX ix_companies_id ON companies (id);

CREATE UNIQUE INDEX ix_companies_tax_id ON companies (tax_id);

CREATE TABLE users (
	email VARCHAR(255) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	role VARCHAR(50) NOT NULL, 
	status BOOLEAN, 
	client_id INTEGER NOT NULL, 
	id SERIAL NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE INDEX ix_users_client_id ON users (client_id);

CREATE INDEX ix_users_id ON users (id);

CREATE TABLE templates (
	name VARCHAR(255) NOT NULL, 
	description VARCHAR(500), 
	client_id INTEGER NOT NULL, 
	id SERIAL NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX ix_templates_client_id ON templates (client_id);

CREATE INDEX ix_templates_id ON templates (id);

CREATE TABLE template_tasks (
	template_id INTEGER NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	type VARCHAR(50) NOT NULL, 
	description VARCHAR(500), 
	"order" INTEGER NOT NULL, 
	responsible_role VARCHAR(50), 
	client_id INTEGER NOT NULL, 
	id SERIAL NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(template_id) REFERENCES templates (id)
);

CREATE INDEX ix_template_tasks_id ON template_tasks (id);

CREATE INDEX ix_template_tasks_client_id ON template_tasks (client_id);

CREATE TABLE journeys (
	employee_id INTEGER NOT NULL, 
	template_id INTEGER, 
	role VARCHAR(50), 
	progress INTEGER, 
	start_date TIMESTAMP WITHOUT TIME ZONE, 
	end_date TIMESTAMP WITHOUT TIME ZONE, 
	location VARCHAR(255), 
	client_id INTEGER NOT NULL, 
	id SERIAL NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(template_id) REFERENCES templates (id)
);

CREATE INDEX ix_journeys_id ON journeys (id);

CREATE INDEX ix_journeys_employee_id ON journeys (employee_id);

CREATE INDEX ix_journeys_client_id ON journeys (client_id);

CREATE TABLE journey_tasks (
	journey_id INTEGER NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	stage VARCHAR(100), 
	type VARCHAR(50), 
	description VARCHAR(500), 
	completed BOOLEAN, 
	deadline TIMESTAMP WITHOUT TIME ZONE, 
	responsible_id INTEGER, 
	document_url VARCHAR(500), 
	client_id INTEGER NOT NULL, 
	id SERIAL NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(journey_id) REFERENCES journeys (id)
);

CREATE INDEX ix_journey_tasks_client_id ON journey_tasks (client_id);

CREATE INDEX ix_journey_tasks_id ON journey_tasks (id);


-- ==========================================
-- TABLAS ADICIONALES PARA DASHBOARD (HU-07)
-- ==========================================

CREATE TABLE nps_responses (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
    comment VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users (id)
);

CREATE INDEX ix_nps_responses_client_id ON nps_responses (client_id);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    message VARCHAR(500) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'danger', 'warning', 'info'
    journey_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (journey_id) REFERENCES journeys (id)
);

CREATE INDEX ix_alerts_client_id ON alerts (client_id);
