import { chromium } from 'playwright';

async function testChatUI() {
  const results = {
    step1: { name: 'Click textarea', status: 'pending', error: null },
    step2: { name: 'Type "hello from UI test"', status: 'pending', error: null },
    step3: { name: 'Verify Send button enabled', status: 'pending', error: null },
    step4: { name: 'Click Send', status: 'pending', error: null },
    step5: { name: 'Confirm user message appears', status: 'pending', error: null },
    step6: { name: 'Confirm assistant reply appears', status: 'pending', error: null },
    step7: { name: 'Send second message and verify history', status: 'pending', error: null },
  };

  let browser;
  let page;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Step 1: Click into the chat textarea
    try {
      const textarea = page.locator('textarea[aria-label="Message input"]');
      await textarea.click();
      results.step1.status = 'pass';
    } catch (error) {
      results.step1.status = 'fail';
      results.step1.error = error.message;
      throw error;
    }

    // Step 2: Type "hello from UI test"
    try {
      const textarea = page.locator('textarea[aria-label="Message input"]');
      await textarea.fill('hello from UI test');
      const value = await textarea.inputValue();
      if (value === 'hello from UI test') {
        results.step2.status = 'pass';
      } else {
        throw new Error(`Expected "hello from UI test", got "${value}"`);
      }
    } catch (error) {
      results.step2.status = 'fail';
      results.step2.error = error.message;
      throw error;
    }

    // Step 3: Verify Send button becomes enabled
    try {
      const sendButton = page.locator('button[aria-label="Send message"]');
      const isEnabled = await sendButton.isEnabled();
      if (isEnabled) {
        results.step3.status = 'pass';
      } else {
        throw new Error('Send button is not enabled');
      }
    } catch (error) {
      results.step3.status = 'fail';
      results.step3.error = error.message;
      throw error;
    }

    // Step 4: Send the message (click Send)
    try {
      const sendButton = page.locator('button[aria-label="Send message"]');
      await sendButton.click();
      results.step4.status = 'pass';
    } catch (error) {
      results.step4.status = 'fail';
      results.step4.error = error.message;
      throw error;
    }

    // Step 5: Confirm user message appears in history area
    try {
      // Wait for the user message to appear
      const userMessage = page.locator('text="hello from UI test"').first();
      await userMessage.waitFor({ timeout: 5000 });
      results.step5.status = 'pass';
    } catch (error) {
      results.step5.status = 'fail';
      results.step5.error = error.message;
      throw error;
    }

    // Step 6: Wait for Claude response and confirm assistant message appears
    try {
      // Wait for assistant response (look for a message that's not the user's message)
      // The assistant message should appear after a brief delay
      await page.waitForTimeout(2000); // Give API time to respond
      
      // Check if there are at least 2 messages (user + assistant)
      const messages = page.locator('[role="article"]');
      const count = await messages.count();
      
      if (count >= 2) {
        results.step6.status = 'pass';
      } else {
        // Wait a bit longer for the API response
        await page.waitForTimeout(5000);
        const newCount = await messages.count();
        if (newCount >= 2) {
          results.step6.status = 'pass';
        } else {
          throw new Error(`Expected at least 2 messages, found ${newCount}`);
        }
      }
    } catch (error) {
      results.step6.status = 'fail';
      results.step6.error = error.message;
      throw error;
    }

    // Step 7: Send a second message "second test" and confirm first messages remain visible
    try {
      const textarea = page.locator('textarea[aria-label="Message input"]');
      await textarea.fill('second test');
      
      const sendButton = page.locator('button[aria-label="Send message"]');
      await sendButton.click();
      
      // Wait for the second user message to appear
      await page.waitForTimeout(1000);
      
      // Verify both "hello from UI test" and "second test" are visible
      const firstMessage = page.locator('text="hello from UI test"');
      const secondMessage = page.locator('text="second test"');
      
      const firstVisible = await firstMessage.isVisible();
      const secondVisible = await secondMessage.isVisible();
      
      if (firstVisible && secondVisible) {
        results.step7.status = 'pass';
      } else {
        throw new Error(`First message visible: ${firstVisible}, Second message visible: ${secondVisible}`);
      }
    } catch (error) {
      results.step7.status = 'fail';
      results.step7.error = error.message;
    }

  } catch (error) {
    console.error('Test execution error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print results
  console.log('\n=== CHAT UI TEST RESULTS ===\n');
  for (const [key, result] of Object.entries(results)) {
    const status = result.status === 'pass' ? '✅ PASS' : 
                   result.status === 'fail' ? '❌ FAIL' : 
                   '⏭️  SKIPPED';
    console.log(`${status} - ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }
  console.log('\n');

  // Return exit code based on results
  const allPassed = Object.values(results).every(r => r.status === 'pass');
  process.exit(allPassed ? 0 : 1);
}

testChatUI();
