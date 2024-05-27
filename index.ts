import puppeteer, { Page } from "puppeteer";
import login from "./login";
import config from "./config";
import { findJobs, applyToJob, ApplicationFormData } from "./jobs";



async function main() {
    const browser = await puppeteer.launch({
        headless: false,
        ignoreHTTPSErrors: true,
        args: ["--disable-setuid-sandbox", "--no-sandbox", "--incognito"]
      });
      const context = await browser.createBrowserContext();
      const listingPage = await context.newPage();

      const pages = await browser.pages();

      await pages[0].close();

      await login({
        page: listingPage,
        email: config.LINKEDIN_EMAIL,
        password: config.LINKEDIN_PASSWORD
      });

      const formData: ApplicationFormData = {
        phone: config.PHONE,
        cvPath: config.CV_PATH,
        homeCity: config.HOME_CITY,
        coverLetterPath: config.COVER_LETTER_PATH,
        yearsOfExperience: config.YEARS_OF_EXPERIENCE,
        languageProficiency: config.LANGUAGE_PROFICIENCY,
        requiresVisaSponsorship: config.REQUIRES_VISA_SPONSORSHIP,
        booleans: config.BOOLEANS,
        textFields: config.TEXT_FIELDS,
        multipleChoiceFields: config.MULTIPLE_CHOICE_FIELDS,
      };
      

      const links = await findJobs(listingPage,config.KEYWORDS)
      
      links.forEach((link) => {
        applyToJob(listingPage,link,formData)
      })

      listingPage.close()
}

main()