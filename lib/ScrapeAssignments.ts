import puppeteer from 'puppeteer';

interface Task {
  title: string;
  description: string | null;
  due_date: string;       // must be a valid datetime string
  repeated: boolean;
  completed: boolean;
  category: string | null;
  priority: string;
  space_id: string | null;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrapeAssignments(): Promise<Task[]> {
  const browser = await puppeteer.launch({
    headless: false,       // Show the browser so you can manually log in
    defaultViewport: null,
  });

  const page = await browser.newPage();

  // 1. Go to the Brightspace calendar
  await page.goto('https://purdue.brightspace.com/d2l/le/calendar/6824');
  console.log('🔐 Please log in (DUO) manually... waiting for "List" tab...');

  // 2. Wait for the "List" tab
  await page.waitForSelector('#ListPageViewSelector', { timeout: 120000 });

  // 3. Click the "List" tab
  await page.click('#ListPageViewSelector');
  console.log('🖱 Clicked "List" tab');

  // 4. Delay to let dynamic content load
  await delay(5000);

  // 5. Wait for assignment rows
  await page.waitForSelector('li.d2l-datalist-item.d2l-datalist-item-actionable', { timeout: 15000 });

  // 6. Scrape data
  const tasks = await page.evaluate(() => {
    // We'll build the final array of "tasks"
    const results: Task[] = [];

    const rows = document.querySelectorAll('li.d2l-datalist-item.d2l-datalist-item-actionable');
    rows.forEach((row) => {
      const titleDiv = row.querySelector('.d2l-textblock-strong');
      const dateDiv = row.querySelector('.d2l-textblock:not(.d2l-textblock-strong)');
      const courseDiv = row.querySelector('.d2l-offscreen');

      const rawTitle = titleDiv?.textContent?.trim() || '';
      const rawDate = dateDiv?.textContent?.trim() || '';
      const rawCourse = courseDiv?.textContent?.trim() || 'Unknown Course';

      if (!rawTitle || !rawDate) return;

      // 📌 Filter: Only keep titles ending in " - Due" (case-insensitive)
      const lowerTitle = rawTitle.toLowerCase();
      if (!lowerTitle.endsWith(' - due')) {
        // Skip anything that doesn't end with " - Due"
        return;
      }

      // Convert to standard ISO date
      const dateObj = new Date(rawDate);
      const isoDate = dateObj.toISOString();

      // Build the "tasks" object
      results.push({
        title: rawTitle,
        description: `Scraped from Brightspace: ${rawTitle}`,
        due_date: isoDate,
        repeated: false,
        completed: false,
        category: rawCourse,
        priority: 'normal',
        space_id: null,
      });
    });

    return results;
  });

  await browser.close();
  return tasks;
}

// Run it directly for a demo
if (require.main === module) {
  scrapeAssignments()
    .then((assignments) => {
      console.log(JSON.stringify(assignments, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error scraping:', err);
      process.exit(1);
    });
}