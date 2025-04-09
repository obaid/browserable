-- -------------------------------------------------------------
-- Database: browserable
-- -------------------------------------------------------------

-- First, drop tables in reverse order of dependencies
DROP TABLE IF EXISTS browserable.browser_session_requests;
DROP TABLE IF EXISTS browserable.browser_sessions;
DROP TABLE IF EXISTS browserable.message_logs;
DROP TABLE IF EXISTS browserable.file_chunks;
DROP TABLE IF EXISTS browserable.files;
DROP TABLE IF EXISTS browserable.integrations;
DROP TABLE IF EXISTS browserable.llm_calls;
DROP TABLE IF EXISTS browserable.nodes;
DROP TABLE IF EXISTS browserable.threads;
DROP TABLE IF EXISTS browserable.runs;
DROP TABLE IF EXISTS browserable.flows;
DROP TABLE IF EXISTS browserable.otp;
DROP TABLE IF EXISTS browserable.login_token;
DROP TABLE IF EXISTS browserable.account_users;
DROP TABLE IF EXISTS browserable.accounts;
DROP TABLE IF EXISTS browserable.users;
DROP TABLE IF EXISTS browserable.waitlist;

-- Drop sequences
DROP SEQUENCE IF EXISTS browserable.user_id_seq;
DROP SEQUENCE IF EXISTS browserable.login_token_id_seq;
DROP SEQUENCE IF EXISTS browserable.otp_id_seq;
DROP SEQUENCE IF EXISTS browserable.llm_calls_id_seq;
DROP SEQUENCE IF EXISTS browserable.message_logs_id_seq;

-- Create schema
CREATE SCHEMA IF NOT EXISTS browserable;


-- Create sequences first
CREATE SEQUENCE IF NOT EXISTS browserable.user_id_seq;
CREATE SEQUENCE IF NOT EXISTS browserable.login_token_id_seq;
CREATE SEQUENCE IF NOT EXISTS browserable.otp_id_seq;
CREATE SEQUENCE IF NOT EXISTS browserable.llm_calls_id_seq;
CREATE SEQUENCE IF NOT EXISTS browserable.message_logs_id_seq;

-- Create waitlist table
CREATE TABLE "browserable"."waitlist" (
    "email" text NOT NULL,
    "processed_email" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "approved" boolean NOT NULL DEFAULT false,
    "metadata" json,
    PRIMARY KEY ("processed_email")
);

-- Create base tables first (no foreign keys)
CREATE TABLE "browserable"."users" (
    "id" int4 NOT NULL DEFAULT nextval('browserable.user_id_seq'::regclass),
    "email" text NOT NULL,
    "processed_email" text NOT NULL,
    "name" text,
    "created_at" timestamptz NOT NULL,
    "pic" varchar,
    "pro" bool,
    "settings" json,
    PRIMARY KEY ("processed_email")
);

CREATE UNIQUE INDEX user_id_key ON browserable.users USING btree (id);

CREATE TABLE "browserable"."accounts" (
    "id" text NOT NULL,
    "name" text NOT NULL,
    "metadata" json,
    PRIMARY KEY ("id")
);

CREATE TABLE "browserable"."api_keys" (
    "id" uuid NOT NULL,
    "account_id" text NOT NULL,
    "user_id" int4 NOT NULL,
    "api_key" text NOT NULL,
    "name" text NOT NULL,
    "created_at" timestamptz NOT NULL,
    "last_used_at" timestamptz,
    "metadata" json,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts("id"),
    UNIQUE ("api_key")
);

-- Tables with foreign keys to users and/or accounts
CREATE TABLE "browserable"."account_users" (
    "account_id" text NOT NULL,
    "user_id" int4 NOT NULL,
    "role" text,
    PRIMARY KEY ("account_id","user_id"),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts("id"),
    FOREIGN KEY ("user_id") REFERENCES browserable.users("id")
);

CREATE TABLE "browserable"."login_token" (
    "id" int4 NOT NULL DEFAULT nextval('browserable.login_token_id_seq'::regclass),
    "uuid" uuid NOT NULL,
    "user_id" int4 NOT NULL,
    "created_at" timestamptz NOT NULL,
    "ip_address" text NOT NULL,
    "fingerprint" text NOT NULL,
    PRIMARY KEY ("uuid"),
    FOREIGN KEY ("user_id") REFERENCES browserable.users("id")
);

CREATE TABLE "browserable"."otp" (
    "id" int4 NOT NULL DEFAULT nextval('browserable.otp_id_seq'::regclass),
    "created_at" timestamptz NOT NULL,
    "email" text NOT NULL,
    "processed_email" text NOT NULL,
    "otp" text NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE "browserable"."flows" (
    "id" UUID NOT NULL,
    "readable_name" VARCHAR(255) NOT NULL,
    "readable_description" TEXT,
    "user_id" int4 NOT NULL,
    "account_id" text NOT NULL,
    "task" TEXT NOT NULL,
    "triggers" JSON NOT NULL,
    "data" JSON NOT NULL,
    "metadata" JSON NOT NULL,
    "created_at" timestamptz NOT NULL,
    "updated_at" timestamptz NOT NULL,
    "status" VARCHAR(50) NOT NULL CHECK (status IN ('active', 'inactive', 'archived')),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES browserable.users(id),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts(id)
);

CREATE TABLE "browserable"."runs" (
    "id" uuid NOT NULL,
    "user_id" int4 NOT NULL,
    "account_id" text NOT NULL,
    "flow_id" uuid NOT NULL,
    "input" text NOT NULL,
    "trigger_input" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "status" text,
    "error" text,
    "output" text,
    "reasoning" text,
    "nodes" json,
    "data" json,
    "input_wait" json,
    "metadata" json,
    "structured_output" json,
    "private_data" json,
    "live_status" text,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES browserable.users(id),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts(id),
    FOREIGN KEY ("flow_id") REFERENCES browserable.flows(id)
);

CREATE TABLE "browserable"."threads" (
    "id" uuid NOT NULL,
    "run_id" uuid,
    "input" text,
    "data" json,
    "created_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id"),
    FOREIGN KEY ("run_id") REFERENCES browserable.runs(id)
);

CREATE TABLE "browserable"."nodes" (
    "id" uuid NOT NULL,
    "run_id" uuid NOT NULL,
    "thread_id" uuid NOT NULL,
    "agent_code" text NOT NULL,
    "input" text NOT NULL,
    "status" text,
    "live_status" text,
    "error" text,
    "created_at" timestamptz DEFAULT now(),
    "data" json,
    "input_wait" json,
    "trigger_wait" text,
    "private_data" json,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("run_id") REFERENCES browserable.runs(id),
    FOREIGN KEY ("thread_id") REFERENCES browserable.threads(id)
);

CREATE TABLE "browserable"."llm_calls" (
    "id" int4 NOT NULL DEFAULT nextval('browserable.llm_calls_id_seq'::regclass),
    "prompt" json,
    "response" json,
    "model" text,
    "metadata" json,
    "token_meta" json,
    "created_at" timestamptz,
    "completed_at" timestamptz,
    "account_id" text,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts(id)
);

CREATE TABLE "browserable"."integrations" (
    "user_id" int4 NOT NULL,
    "account_id" text NOT NULL,
    "integration" text NOT NULL,
    "type" text NOT NULL,
    "tokens" json,
    "metadata" json,
    PRIMARY KEY ("account_id","integration","type"),
    FOREIGN KEY ("user_id") REFERENCES browserable.users(id),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts(id)
);

CREATE TABLE "browserable"."files" (
    "id" uuid NOT NULL,
    "user_id" int4 NOT NULL,
    "account_id" text NOT NULL,
    "file_type" varchar(50) NOT NULL,
    "file_sub_type" varchar(50),
    "file_source" varchar(100),
    "file_extension" varchar(10),
    "parsed_txt" text,
    "original_ref" varchar(255),
    "created_at" timestamptz,
    "saved_at" timestamptz,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES browserable.users(id),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts(id)
);

CREATE TABLE "browserable"."file_chunks" (
    "id" uuid NOT NULL,
    "file_id" uuid,
    "user_id" int4 NOT NULL,
    "account_id" text NOT NULL,
    "index" int4 NOT NULL,
    "chunk_text" text NOT NULL,
    "created_at" timestamptz,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("file_id") REFERENCES browserable.files(id),
    FOREIGN KEY ("user_id") REFERENCES browserable.users(id),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts(id)
);

CREATE TABLE "browserable"."message_logs" (
    "id" int8 NOT NULL DEFAULT nextval('browserable.message_logs_id_seq'::regclass),
    "node_id" uuid,
    "messages" json,
    "created_at" timestamptz,
    "run_id" uuid,
    "flow_id" uuid,
    "user_id" uuid,
    "thread_id" uuid,
    "account_id" text,
    "segment" text,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("node_id") REFERENCES browserable.nodes(id),
    FOREIGN KEY ("run_id") REFERENCES browserable.runs(id),
    FOREIGN KEY ("flow_id") REFERENCES browserable.flows(id),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts(id),
    FOREIGN KEY ("thread_id") REFERENCES browserable.threads(id)
);

CREATE TABLE "browserable"."browser_sessions" (
    "user_id" int4,
    "profile_id" text,
    "account_id" text,
    "context" json,
    "provider" text,
    PRIMARY KEY ("profile_id","account_id"),
    FOREIGN KEY ("user_id") REFERENCES browserable.users(id),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts(id)
);

CREATE TABLE "browserable"."browser_session_requests" (
    "account_id" text,
    "event_id" text,
    "created_at" timestamptz,
    "metadata" json,
    "status" text,
    "session_id" text,
    PRIMARY KEY ("event_id","account_id"),
    FOREIGN KEY ("account_id") REFERENCES browserable.accounts(id)
);

-- Grant necessary permissions after all objects are created
GRANT ALL PRIVILEGES ON SCHEMA browserable TO supabase_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA browserable TO supabase_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA browserable TO supabase_admin;