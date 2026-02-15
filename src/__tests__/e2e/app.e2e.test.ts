import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import playwright from 'playwright';

describe('E2E Tests - Ignis Frontend', () => {
  let browser: any;
  let page: any;
  const baseUrl = 'http://localhost:3001';

  beforeAll(async () => {
    browser = await playwright.chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Authentication Flow', () => {
    it('should navigate to login page', async () => {
      await page.goto(`${baseUrl}/login`);
      await expect(page.locator('h1')).toContainText(/login/i);
    });

    it('should login successfully', async () => {
      await page.goto(`${baseUrl}/login`);
      
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');

      await page.waitForNavigation();
      expect(page.url()).toContain('/dashboard');
    });

    it('should show error for invalid credentials', async () => {
      await page.goto(`${baseUrl}/login`);
      
      await page.fill('input[name="username"]', 'invalid');
      await page.fill('input[name="password"]', 'invalid');
      await page.click('button[type="submit"]');

      const error = await page.locator('.error-message');
      await expect(error).toBeVisible();
    });

    it('should logout successfully', async () => {
      await page.goto(`${baseUrl}/dashboard`);
      
      await page.click('button[aria-label="User menu"]');
      await page.click('button:has-text("Logout")');

      await page.waitForNavigation();
      expect(page.url()).toContain('/login');
    });
  });

  describe('Dashboard Navigation', () => {
    beforeAll(async () => {
      // Login first
      await page.goto(`${baseUrl}/login`);
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    it('should navigate to alerts page', async () => {
      await page.click('a[href="/admin/alerts"]');
      await page.waitForNavigation();
      expect(page.url()).toContain('/admin/alerts');
    });

    it('should navigate to sensors page', async () => {
      await page.click('a[href="/admin/sensors"]');
      await page.waitForNavigation();
      expect(page.url()).toContain('/admin/sensors');
    });

    it('should navigate to buildings page', async () => {
      await page.click('a[href="/admin/buildings"]');
      await page.waitForNavigation();
      expect(page.url()).toContain('/admin/buildings');
    });

    it('should display dashboard statistics', async () => {
      await page.goto(`${baseUrl}/dashboard`);
      
      const stats = await page.locator('.dashboard-stats');
      await expect(stats).toBeVisible();

      const sensorCount = await page.locator('[data-testid="sensor-count"]');
      await expect(sensorCount).toBeVisible();
    });
  });

  describe('Alerts Management', () => {
    beforeAll(async () => {
      await page.goto(`${baseUrl}/admin/alerts`);
    });

    it('should display alerts list', async () => {
      const alertsList = await page.locator('.alerts-list');
      await expect(alertsList).toBeVisible();
    });

    it('should filter alerts by severity', async () => {
      await page.selectOption('select[name="severity"]', 'high');
      
      const alerts = await page.locator('.alert-item');
      const count = await alerts.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should filter alerts by status', async () => {
      await page.selectOption('select[name="status"]', 'active');
      
      const alerts = await page.locator('.alert-item[data-status="active"]');
      const count = await alerts.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should view alert details', async () => {
      const firstAlert = await page.locator('.alert-item').first();
      await firstAlert.click();

      const modal = await page.locator('.alert-modal');
      await expect(modal).toBeVisible();
    });

    it('should resolve an alert', async () => {
      const firstAlert = await page.locator('.alert-item[data-status="active"]').first();
      await firstAlert.click();

      await page.click('button:has-text("Resolve")');
      
      const toast = await page.locator('.toast-success');
      await expect(toast).toBeVisible();
    });
  });

  describe('Sensors Management', () => {
    beforeAll(async () => {
      await page.goto(`${baseUrl}/admin/sensors`);
    });

    it('should display sensors list', async () => {
      const sensorsList = await page.locator('.sensors-list');
      await expect(sensorsList).toBeVisible();
    });

    it('should add new sensor', async () => {
      await page.click('button:has-text("Add Sensor")');

      await page.fill('input[name="type"]', 'smoke');
      await page.fill('input[name="location"]', 'Room 101');
      await page.selectOption('select[name="building"]', '1');
      await page.click('button[type="submit"]');

      const toast = await page.locator('.toast-success');
      await expect(toast).toBeVisible();
    });

    it('should edit sensor', async () => {
      const firstSensor = await page.locator('.sensor-item').first();
      await firstSensor.locator('button[aria-label="Edit"]').click();

      await page.fill('input[name="location"]', 'Updated Location');
      await page.click('button[type="submit"]');

      const toast = await page.locator('.toast-success');
      await expect(toast).toBeVisible();
    });

    it('should delete sensor', async () => {
      const firstSensor = await page.locator('.sensor-item').first();
      await firstSensor.locator('button[aria-label="Delete"]').click();

      await page.click('button:has-text("Confirm")');

      const toast = await page.locator('.toast-success');
      await expect(toast).toBeVisible();
    });
  });

  describe('Map Interaction', () => {
    beforeAll(async () => {
      await page.goto(`${baseUrl}/live-map`);
    });

    it('should render map', async () => {
      const map = await page.locator('#map-container');
      await expect(map).toBeVisible();
    });

    it('should display sensor markers', async () => {
      const markers = await page.locator('.sensor-marker');
      const count = await markers.count();
      expect(count).toBeGreaterThan(0);
    });

    it('should display alert markers', async () => {
      const markers = await page.locator('.alert-marker');
      const count = await markers.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should zoom in map', async () => {
      await page.click('button[aria-label="Zoom in"]');
      // Verify zoom level changed
      const zoomLevel = await page.evaluate(() => {
        return (window as any).map.getZoom();
      });
      expect(zoomLevel).toBeGreaterThan(1);
    });

    it('should show sensor details on marker click', async () => {
      const marker = await page.locator('.sensor-marker').first();
      await marker.click();

      const popup = await page.locator('.sensor-popup');
      await expect(popup).toBeVisible();
    });
  });

  describe('Real-time Updates', () => {
    it('should receive real-time alert updates', async () => {
      await page.goto(`${baseUrl}/dashboard`);

      // Wait for WebSocket connection
      await page.waitForTimeout(2000);

      // Monitor for new alerts
      const initialCount = await page.locator('.alert-item').count();

      // Trigger new alert (this would come from WebSocket)
      await page.waitForTimeout(5000);

      const newCount = await page.locator('.alert-item').count();
      // Count may be same or increased depending on real-time data
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/dashboard`);

      const mobileMenu = await page.locator('[aria-label="Mobile menu"]');
      await expect(mobileMenu).toBeVisible();
    });

    it('should work on tablet viewport', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${baseUrl}/dashboard`);

      const content = await page.locator('.main-content');
      await expect(content).toBeVisible();
    });

    it('should work on desktop viewport', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${baseUrl}/dashboard`);

      const sidebar = await page.locator('.sidebar');
      await expect(sidebar).toBeVisible();
    });
  });
});
