import {ElementHandle, Page } from 'puppeteer';

import selectors from './selectors';

export interface ApplicationFormData {
    phone: string;
    cvPath: string;
    homeCity: string;
    coverLetterPath: string;
    yearsOfExperience: { [key: string]: number };
    languageProficiency: { [key: string]: string };
    requiresVisaSponsorship: boolean;
    booleans: { [key: string]: boolean };
    textFields: { [key: string]: string };
    multipleChoiceFields: { [key: string]: string };
}

export interface TextFields {
    [labelRegex: string]: string | number;
}

export interface MultipleChoiceFields {
    [labelRegex: string]: string;
}
  
  

const noop = () => { };

function delay(time: number) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

async function findJobs(page: Page, keywords: string): Promise<Array<string>> {

    await page.goto(`https://www.linkedin.com/jobs/search/?&f_AL=true&f_E=2%2C3&geoId=103644278&keywords=${keywords}&location=United%20States&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true`, { waitUntil: 'load' });

    const numJobsHandle = await page.waitForSelector(selectors.searchResultListText, { timeout: 10000 }) as ElementHandle<HTMLElement>;
    const numAvailableJobs = await numJobsHandle.evaluate((el) => parseInt((el as HTMLElement).innerText.replace(',', '')));
    const MAX_PAGE_SIZE = 7;
    let numSeenJobs = 0;
    let links = []

    while (numSeenJobs < numAvailableJobs) {
        try {
            await page.goto(`https://www.linkedin.com/jobs/search/?&f_AL=true&f_E=2%2C3&geoId=103644278&keywords=${keywords}&location=United%20States&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true&start=${numSeenJobs}`, { waitUntil: 'load' });
            await page.waitForSelector(`${selectors.searchResultListItem}:nth-child(${Math.min(MAX_PAGE_SIZE,numAvailableJobs - numSeenJobs)})`, { timeout: 10000 });
            const jobListings = await page.$$(selectors.searchResultListItem);

            for (let i = 0; i < Math.min(jobListings.length, MAX_PAGE_SIZE); i++) {
                const [link, title] = await page.$eval(`${selectors.searchResultListItem}:nth-child(${i + 1}) ${selectors.searchResultListItemLink}`, (el) => {
                    const linkEl = el as HTMLLinkElement;
                    return [linkEl.href.trim(), linkEl.innerText.trim()];
                });
                links.push(link)
            }
            numSeenJobs += Math.min(jobListings.length, MAX_PAGE_SIZE);
        } catch (error) {
            console.log(`Got an error: ${error}`)
        }
    }
    
    return links
    
}

async function applyToJob(page: Page, link: string, formData: ApplicationFormData): Promise<void> {

    try {
        await page.goto(link, { waitUntil: ['load'], timeout: 10000 })
        await page.waitForSelector(selectors.easyApplyButtonEnabled, { timeout: 10000 });
        delay(5000)
        await page.click(selectors.easyApplyButtonEnabled);

        let maxPages = 10;

        while(maxPages--) {
            await fillFields(page, formData);

            await clickNextButton(page).catch(noop);

            await waitForNoError(page).catch(noop);
        }

        const submitButton = await page.$(selectors.submit);

        if (!submitButton) {
            throw new Error('Submit button not found');
        }
        await submitButton.click();

    }
    catch(e) {
        console.log(`Ran into this error: ${e}. Skipping this application`)
    }


}

async function fillFields(page: Page, formData: ApplicationFormData): Promise<void>{   
    await insertHomeCity(page, formData.homeCity).catch(noop);
    await insertPhone(page,formData.phone).catch(noop);
    await uncheckFollowCompany(page).catch(noop)
    await uploadDocs(page, formData.cvPath, formData.coverLetterPath).catch(noop);

    const textFields = {
        ...formData.textFields,
        ...formData.yearsOfExperience,
    };
    
    await fillTextFields(page, textFields).catch(noop);

    const booleans = formData.booleans;
    booleans['sponsorship'] = formData.requiresVisaSponsorship;

    await fillBoolean(page, booleans).catch(noop);

    const multipleChoiceFields = {
    ...formData.languageProficiency,
    ...formData.multipleChoiceFields,
    };
    
    await fillMultipleChoiceFields(page, multipleChoiceFields).catch(noop);
    
    

}

async function fillTextFields(page: Page, textFields: TextFields): Promise<void> {
    const inputs = await page.$$(selectors.textInput);
  
    for (const input of inputs) {
      const id = await input.evaluate((el) => el.id);
      const label = await page.$eval(`label[for="${id}"]`, (el) => el.innerText).catch(() => '');
  
      for (const [labelRegex, value] of Object.entries(textFields)) {
        if (new RegExp(labelRegex, 'i').test(label)) {
          await changeTextInput(input, '', value.toString());
        }
        else if(new RegExp('experience', 'i').test(label)) {
          await changeTextInput(input, '', `2`);
        }
        else if(new RegExp('US citizen', 'i').test(label) || new RegExp('United States citizen', 'i').test(label)) {
          await changeTextInput(input, '', `I am a United States citizen.`);
        }
        else {
          await changeTextInput(input, '', `Please contact for answer`);
        }
      }
    }
}

async function fillBoolean(page: Page, booleans: { [key: string]: boolean }): Promise<void> {
    const fieldsets = await page.$$(selectors.fieldset);
  
    // fill 2 option radio button field sets
    for (const fieldset of fieldsets) {
      const options = await fieldset.$$(selectors.radioInput);
  
      if (options.length === 2) {
        const label = await fieldset.$eval('legend', el => el.innerText);
  
        for (const [labelRegex, value] of Object.entries(booleans)) {
          if (new RegExp(labelRegex, "i").test(label)) {
            const input = await fieldset.$(`${selectors.radioInput}[value='${value ? 'Yes' : 'No'}']`) as ElementHandle;
  
            await input.click();
          }
        }
      }
    }
}

async function clickNextButton(page: Page): Promise<void> {
    await page.click(selectors.nextButton);
  
    await page.waitForSelector(selectors.enabledSubmitOrNextButton, { timeout: 10000 });
  }

async function insertHomeCity(page: Page, homeCity: string): Promise<void> {
    await changeTextInput(page, selectors.homeCity, homeCity);
  
    // click the background to make the country popup lose focus
    let background = await page.$(selectors.easyApplyFormBackground) as ElementHandle;
    await background.click({ clickCount: 1 });      
}

async function insertPhone(page: Page, phone: string): Promise<void> {
    await changeTextInput(page, selectors.phone, phone);
}

async function uncheckFollowCompany(page: Page) {
    const checkbox = await page.$(selectors.followCompanyCheckbox);
  
    if(checkbox)
      await (checkbox as ElementHandle<HTMLInputElement>).evaluate(el => el.checked && el.click());
}

async function uploadDocs(page: Page, cvPath: string, coverLetterPath: string): Promise<void> {
    const docDivs = await page.$$(selectors.documentUpload);
  
    for (const docDiv of docDivs) {
      const label = await docDiv.$(selectors.documentUploadLabel) as ElementHandle<HTMLElement>;
      const input = await docDiv.$(selectors.documentUploadInput) as ElementHandle<HTMLInputElement>;
  
      const text = await label.evaluate((el) => el.innerText.trim());
  
      if (text.includes("resume")) {
        await input.uploadFile(cvPath);
      } else if (text.includes("cover")) {
        await input.uploadFile(coverLetterPath);
      }
    }
}

async function fillMultipleChoiceFields(page: Page, multipleChoiceFields: MultipleChoiceFields): Promise<void> {
    const selects = await page.$$(selectors.select);
  
    for (const select of selects) {
      const id = await select.evaluate((el) => el.id);
      const label = await page.$eval(`label[for="${id}"]`, (el) => el.innerText);
  
      for (const [labelRegex, value] of Object.entries(multipleChoiceFields)) {
        if (new RegExp(labelRegex, 'i').test(label)) {
          const option = await select.$$eval(selectors.option, (options, value) => {
            const option = (options as HTMLOptionElement[]).find((option) => option.value.toLowerCase() === value.toLowerCase());
  
            return option && option.value;
          }, value);
  
          if (option) {
            await select.select(option);
          }
        }
      }
    }
}

async function changeTextInput(container: ElementHandle | Page, selector: string, value: string): Promise<void> {
    let input = selector ? await container.$(selector) : container as ElementHandle;
  
    if (!input) {
      throw `Couldn't find element with selector ${selector}`;
    }
  
    const previousValue = await input.evaluate((el) => (el as HTMLInputElement).value);
  
    if (previousValue !== value) {
      await input.click({ clickCount: 3 }); // Select whole text to replace existing text
      await input.type(value);
    }
}

async function waitForNoError(page: Page): Promise<void> {
    await page.waitForFunction(() => !document.querySelector("div[id*='error'] div[class*='error']"), { timeout: 1000 });
}





export {findJobs, applyToJob}