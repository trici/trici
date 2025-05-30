const { DhappService } = require('./dist/index');
const { DhappJobType } = require('@trici/models');
const { getConsoleLogger } = require('@trici/logger');
const { DhappJobRepository, SqliteDbManager } = require('@trici/dal');
const path = require('path');
const knexfile = require('./sampledata/knexfile.js');
require('source-map-support').install();

async function main() {
  // Initialize dependencies
  const dbManager = new SqliteDbManager(getConsoleLogger);
  const dbPath = path.join(__dirname, 'sampledata/db');
  await dbManager.init(dbPath, knexfile);
  const jobRepository = new DhappJobRepository(dbManager.getDb(), getConsoleLogger);
  const ffmpegPath = path.join(__dirname, 'sampledata/ffmpeg');

  // Create DhappService instance
  const dhappService = new DhappService(jobRepository, ffmpegPath, getConsoleLogger);

  // Start the service
  dhappService.start();

  try {
    // Create a sample job for processing
    const sampleJob = {
      job_session_directory: './sampledata/1748164880469',
      job_name: '1748164880469_0000',
      job_type: DhappJobType.FOCUS_SESSION_CHUNK,
    };

    // Queue the job
    getConsoleLogger().info('Queueing job for processing...');
    const queuedJob = await dhappService.queueJob(sampleJob);
    getConsoleLogger().info('Job queued successfully:', queuedJob);
  } catch (error) {
    getConsoleLogger().error('Error processing job:', error);
  }

  // Keep the process running for a while to allow processing
  await new Promise(resolve => setTimeout(resolve, 30000)); // Wait for 30 seconds

  // Stop the service
  dhappService.stop();
  process.exit(0);
}

// Run the main function
main().catch(error => {
  getConsoleLogger().error('Fatal error:', error);
  process.exit(1);
});
