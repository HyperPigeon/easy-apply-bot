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

      // const formData: ApplicationFormData = {
      //   phone: config.PHONE,
      //   cvPath: config.CV_PATH,
      //   homeCity: config.HOME_CITY,
      //   coverLetterPath: config.COVER_LETTER_PATH,
      //   yearsOfExperience: config.YEARS_OF_EXPERIENCE,
      //   languageProficiency: config.LANGUAGE_PROFICIENCY,
      //   requiresVisaSponsorship: config.REQUIRES_VISA_SPONSORSHIP,
      //   booleans: config.BOOLEANS,
      //   textFields: config.TEXT_FIELDS,
      //   multipleChoiceFields: config.MULTIPLE_CHOICE_FIELDS,
      // };
      

      // const links = await findJobs(listingPage,config.KEYWORDS)
      
      // // links.forEach((link) => {
      // //   applyToJob(listingPage,link,formData)
      // // })

      // await applyToJob(listingPage, `https://www.linkedin.com/jobs/view/3919321857/?eBP=CwEAAAGPtzVyrMmFCxoteXruehaDuJeeQqKrv3r2B7TCEpBsIwT3aDXg8WzYAlDC9_OOVZX3IL6SjL1-pZNw5fsvrzE9qnIX8JXkZnqPUBOKOYhQPgKPAPovoLQdnRlJcdT9BHJIgFvUae-6kwZTfyxuxVosalyW3WrMTniIvShbHcHMWXIFqt_aklSFLJwEiIM9jR-r8aYb8DH0Yn1Aajl0JGxIV7ZpnGTHv2xuHKsvVGxt-OSV3JKJ-LlaKIuKSILH1r1-Aso5kW4cdlHU8rmAMsoeIvVV8QT6XgVdG4r2aoEZQOeWkjK9bQmjx4EaYZIquTPlQGrfjbwMubRX_EX_gNmnMXKd5kj8LQN0quCmGt5HiZQyXt_bi67GpG6czwSCesaQrttN67RH7lp6PEJO8V7wuI0yR-04GysUtA99jrEMwx766rtE_G64QxY7ziaOhes1quKFVzC7W8XFakzk4dECvkmzDw&refId=00YPpgTZqHzJsZokn%2BoTVw%3D%3D&trackingId=Bn8K0Jh5vmUxBlCY0VSdAA%3D%3D&trk=flagship3_search_srp_jobs`,formData)

      // // listingPage.close()
}

main()