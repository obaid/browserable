#!/usr/bin/env node --no-warnings

// Suppress experimental warnings
process.removeAllListeners('warning');

import { program } from 'commander';
import { execa } from 'execa';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import open from 'open';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

const spinner = ora();
const REPO_URL = 'https://github.com/browserable/browserable.git';
const REPO_FOLDER = 'browserable';

async function checkDocker() {
  try {
    await execa('docker', ['--version']);
    return true;
  } catch (error) {
    return false;
  }
}

async function checkDockerCompose() {
  try {
    await execa('docker-compose', ['--version']);
    return true;
  } catch (error) {

    // the new docker compose might be "docker compose"
    try {
      await execa('docker', ['compose', 'version']);
      return true;
    } catch (error) {
      return false;
    }
  }
}

async function cloneRepo() {
  // Check if browserable folder already exists
  if (fs.existsSync(REPO_FOLDER)) {
    console.log(chalk.yellow('Browserable folder already exists, skipping clone step.'));
    return true;
  }

  spinner.start('Cloning repository...');
  try {
    await execa('git', ['clone', REPO_URL, 'browserable']);
    spinner.succeed('Repository cloned successfully');
    return true;
  } catch (error) {
    spinner.fail('Failed to clone repository');
    console.error(chalk.red(error.message));
    return false;
  }
}

async function dockerBaseCommand() {
  // if docker compose version works, return docker compose. else return docker-compose
  try {
    await execa('docker', ['compose', 'version']);
    return 'docker compose';
  } catch (error) {
    return 'docker-compose';
  }
}

async function startDockerCompose() {
  spinner.stop();
  console.log(chalk.blue('Building Docker containers...'));
  const dockerCmd = await dockerBaseCommand();
  try {
    process.chdir(REPO_FOLDER + '/deployment');
    // Split the command into parts if it's 'docker compose'
    if (dockerCmd === 'docker compose') {
      // First build
      await execa('docker', ['compose', '-f', 'docker-compose.dev.yml', 'build'], {
        stdio: 'inherit'
      });
      // Then start
      console.log(chalk.blue('\nStarting Docker containers...'));
      await execa('docker', ['compose', '-f', 'docker-compose.dev.yml', 'up', '-d'], {
        stdio: 'inherit'
      });
    } else {
      // First build
      await execa(dockerCmd, ['-f', 'docker-compose.dev.yml', 'build'], {
        stdio: 'inherit'
      });
      // Then start
      console.log(chalk.blue('\nStarting Docker containers...'));
      await execa(dockerCmd, ['-f', 'docker-compose.dev.yml', 'up', '-d'], {
        stdio: 'inherit'
      });
    }
    console.log(chalk.green('\nDocker containers built and started successfully'));
    return true;
  } catch (error) {
    console.error(chalk.red('Failed to build or start Docker containers'));
    console.error(chalk.red(error.message));
    return false;
  }
}

async function main() {
  console.log(chalk.blue('Welcome to Browserable Setup!'));
  
  // Check and install Docker if needed
  if (!(await checkDocker())) {
    console.log(chalk.yellow('\nDocker is not installed on your system.'));
    console.log(chalk.blue('\nPlease visit: https://docs.docker.com/engine/install/ to install Docker for your operating system.'));
    console.log(chalk.yellow('\nAfter installing Docker, please run this command again.'));
    return;
  }

  // Check and install Docker Compose if needed
  if (!(await checkDockerCompose())) {
    console.log(chalk.yellow('\nDocker Compose is not installed on your system.'));
    console.log(chalk.blue('\nPlease visit: https://docs.docker.com/compose/install/ to install Docker Compose for your operating system.'));
    console.log(chalk.yellow('\nAfter installing Docker Compose, please run this command again.'));
    return;
  }

  // Clone repository
  if (!(await cloneRepo())) {
    return;
  }

  // Start Docker Compose
  if (!(await startDockerCompose())) {
    return;
  }

  console.log(chalk.green('\n🎉 Browserable is now running!'));
  console.log(chalk.blue('\nYou can access admin ui at: http://localhost:2001'));
  console.log(chalk.blue('\nYou can access the documentation at: http://localhost:2002'));
  console.log(chalk.blue('\nYou can access the api at: http://localhost:2003'));
  console.log(chalk.blue('\nYou can access supabase studio at: http://localhost:8000'));
  console.log(chalk.blue('\nYou can access mongo express at: http://localhost:3300'));
  console.log(chalk.blue('\nYou can access minio S3 storage at: http://localhost:9001'));
  console.log(chalk.blue('\nYou can access redis queue system at: http://localhost:2003/admin/queues'));
  
  // Open admin UI in default browser
  try {
    await open('http://localhost:2001');
    console.log(chalk.green('\nOpened admin UI in your default browser'));
  } catch (error) {
    console.log(chalk.yellow('\nCould not automatically open browser. Please open http://localhost:2001 manually'));
  }

  console.log(chalk.yellow('\nTo stop the application, run: docker-compose down'));
}

program
  .name('browserable')
  .description('CLI to setup and run Browserable')
  .version(packageJson.version)
  .action(main);

program.parse(); 