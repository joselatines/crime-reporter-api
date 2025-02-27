import express from "express";
import Scrapper from "../lib/Scrapper";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const router = express.Router();

// Helper function to check if Chrome is installed
async function checkChromeInstallation() {
  try {
    const { stdout } = await execAsync('which google-chrome-stable || which google-chrome || echo "not found"');
    const chromePath = stdout.trim();
    
    if (chromePath === "not found") {
      console.warn("Chrome not found on system PATH");
      return false;
    }
    
    console.log(`Chrome found at: ${chromePath}`);
    return true;
  } catch (error) {
    console.error("Error checking Chrome installation:", error);
    return false;
  }
}

router.get<{}, any>("/", async (req, res) => {
	try {
		console.log("Starting scraping process...");
		console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
		
		// Check Chrome installation
		const chromeInstalled = await checkChromeInstallation();
		console.log(`Chrome installation check: ${chromeInstalled ? 'Installed' : 'Not found'}`);
		
		// Log environment variables related to Puppeteer
		console.log(`PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'not set'}`);
		console.log(`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: ${process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || 'not set'}`);
		
		const scraper = new Scrapper();
		
		console.log("Initializing scraper...");
		await scraper.init();
		
		console.log("Saving news to database...");
		const news = scraper.saveNewsIntoDatabase();

		res.json({ 
			message: "Scrapping processing...", 
			success: true,
			newsCount: 0,
			chromeInstalled,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error("Scraping error:", error);
		
		// Provide more detailed error information
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		const errorStack = error instanceof Error ? error.stack : '';
		
		// Check Chrome installation on error
		let chromeInfo = "Unknown";
		try {
			const chromeInstalled = await checkChromeInstallation();
			chromeInfo = chromeInstalled ? "Installed" : "Not found";
		} catch (e: any) {
			chromeInfo = `Error checking: ${e?.message || 'Unknown error'}`;
		}
		
		res.status(500).json({ 
			message: "Scrapping failed", 
			error: errorMessage,
			chromeInfo,
			stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
			timestamp: new Date().toISOString()
		});
	}
});

export default router;
