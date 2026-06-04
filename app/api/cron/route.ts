// ============================================
// CAREHUB AI AGENT — CRON JOB ENDPOINT
// ============================================
// Called by Vercel Cron every 6 hours.
// Runs automated tasks even when PC is off:
// - Price monitoring (check supplier prices)
// - Order fulfillment (check & update tracking)
// - Store health check
// - Memory cleanup
// Schedule: "0 */6 * * *" (every 6 hours)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getPriceMonitor } from '@/agents/price-monitor';
import { getOrderFulfillment } from '@/agents/order-fulfillment';
import { getMemoryAgent } from '@/agents/memory';
import { getAIRouter } from '@/agents/ai-router';

// --------------------------------------------
// TYPES
// --------------------------------------------

interface CronResult {
  success: boolean;
  timestamp: string;
  duration: number;
  tasks: CronTaskResult[];
  summary: string;
  nextRun: string;
}

interface CronTaskResult {
  task: string;
  success: boolean;
  message: string;
  duration: number;
  details?: Record<string, unknown>;  // ✅ FIXED
}

// --------------------------------------------
// CRON SECRET VALIDATION
// --------------------------------------------

function validateCronRequest(request: NextRequest): boolean {
  // Vercel Cron sends this header automatically
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, validate it
  if (cronSecret) {
    if (authHeader === `Bearer ${cronSecret}`) {
      return true;
    }

    // Also check Vercel's internal cron header
    const vercelCron = request.headers.get('x-vercel-cron');
    if (vercelCron) {
      return true; // Vercel's internal cron calls are trusted
    }

    return false;
  }

  // If no CRON_SECRET set, allow Vercel cron headers
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron) return true;

  // Allow in development
  if (process.env.NODE_ENV === 'development') return true;

  // Allow manual trigger with query param (for testing)
  const manualTrigger = request.nextUrl.searchParams.get('key');
  if (manualTrigger && cronSecret && manualTrigger === cronSecret) return true;

  return false;
}

// --------------------------------------------
// GET HANDLER — Cron Job Execution
// --------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse<CronResult>> {  // ✅ FIXED
  const startTime = Date.now();
  const tasks: CronTaskResult[] = [];

  // ------------------------------------------
  // AUTHENTICATION
  // ------------------------------------------

  if (!validateCronRequest(request)) {
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      duration: 0,
      tasks: [],
      summary: '🔒 Unauthorized — invalid or missing CRON_SECRET',
      nextRun: '',
    }, { status: 401 });
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  ⏰ CAREHUB CRON JOB STARTED                    ║');
  console.log(`║  Time: ${new Date().toISOString()}              `);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  try {
    // ------------------------------------------
    // TASK 1: PRICE MONITORING
    // ------------------------------------------

    const priceTaskStart = Date.now();
    console.log('[Cron] 📊 Task 1: Price Monitoring...');

    try {
      const priceMonitor = getPriceMonitor();
      const priceResult = await priceMonitor.runMonitor();

      tasks.push({
        task: 'price_monitor',
        success: priceResult.success,
        message: priceResult.message,
        duration: Date.now() - priceTaskStart,
        details: {
          checked: priceResult.checked,
          updated: priceResult.updated,
          alerts: priceResult.alerts.length,
          errors: priceResult.errors.length,
        },
      });

      console.log(`[Cron] ✅ Price Monitor: Checked ${priceResult.checked}, Updated ${priceResult.updated}, Alerts ${priceResult.alerts.length}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      tasks.push({
        task: 'price_monitor',
        success: false,
        message: `Error: ${errMsg}`,
        duration: Date.now() - priceTaskStart,
      });
      console.error(`[Cron] ❌ Price Monitor failed:`, errMsg);
    }

    // ------------------------------------------
    // TASK 2: ORDER TRACKING UPDATES
    // ------------------------------------------

    const orderTaskStart = Date.now();
    console.log('[Cron] 📦 Task 2: Order Tracking Updates...');

    try {
      const orderFulfillment = getOrderFulfillment();
      const orderResult = await orderFulfillment.cronProcess();

      tasks.push({
        task: 'order_tracking',
        success: orderResult.success,
        message: orderResult.message,
        duration: Date.now() - orderTaskStart,
      });

      console.log(`[Cron] ✅ Orders: ${orderResult.message}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      tasks.push({
        task: 'order_tracking',
        success: false,
        message: `Error: ${errMsg}`,
        duration: Date.now() - orderTaskStart,
      });
      console.error(`[Cron] ❌ Order Tracking failed:`, errMsg);
    }

    // ------------------------------------------
    // TASK 3: SYSTEM HEALTH CHECK
    // ------------------------------------------

    const healthTaskStart = Date.now();
    console.log('[Cron] 🏥 Task 3: System Health Check...');

    try {
      const router = getAIRouter();
      const routerStatus = router.getStatus();

      const healthReport = {
        groq: routerStatus.groq.healthy,
        gemini: routerStatus.gemini.healthy,
        totalRouted: routerStatus.totalRequestsRouted,
        fallbacks: routerStatus.fallbackCount,
      };

      const allHealthy = healthReport.groq && healthReport.gemini;

      tasks.push({
        task: 'health_check',
        success: allHealthy,
        message: allHealthy
          ? `All systems healthy. Groq: ✅ | Gemini: ✅ | Routed: ${healthReport.totalRouted}`
          : `Issues detected. Groq: ${healthReport.groq ? '✅' : '❌'} | Gemini: ${healthReport.gemini ? '✅' : '❌'}`,
        duration: Date.now() - healthTaskStart,
        details: healthReport,
      });

      console.log(`[Cron] ${allHealthy ? '✅' : '⚠️'} Health: Groq ${healthReport.groq ? '✅' : '❌'}, Gemini ${healthReport.gemini ? '✅' : '❌'}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      tasks.push({
        task: 'health_check',
        success: false,
        message: `Error: ${errMsg}`,
        duration: Date.now() - healthTaskStart,
      });
      console.error(`[Cron] ❌ Health Check failed:`, errMsg);
    }

    // ------------------------------------------
    // TASK 4: MEMORY MAINTENANCE
    // ------------------------------------------

    const memoryTaskStart = Date.now();
    console.log('[Cron] 💾 Task 4: Memory Maintenance...');

    try {
      const memory = getMemoryAgent();
      const stats = await memory.getStats();

      // Force save to ensure persistence
      await memory.forceSave();

      // Log cron run
      await memory.logAction({
        agent: 'system',
        action: 'cron_run',
        input: `Scheduled run at ${new Date().toISOString()}`,
        output: `Tasks: ${tasks.length}, All success: ${tasks.every(t => t.success)}`,
        success: true,
        duration: Date.now() - startTime,
        reversible: false,
      });

      tasks.push({
        task: 'memory_maintenance',
        success: true,
        message: `Memory saved. Messages: ${stats.totalMessages}, Actions: ${stats.totalActions}, Storage: ${stats.storageType}`,
        duration: Date.now() - memoryTaskStart,
        details: {
          totalMessages: stats.totalMessages,
          totalActions: stats.totalActions,
          storageType: stats.storageType,
        },
      });

      console.log(`[Cron] ✅ Memory: ${stats.totalMessages} messages, ${stats.totalActions} actions, ${stats.storageType}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      tasks.push({
        task: 'memory_maintenance',
        success: false,
        message: `Error: ${errMsg}`,
        duration: Date.now() - memoryTaskStart,
      });
      console.error(`[Cron] ❌ Memory Maintenance failed:`, errMsg);
    }

    // ------------------------------------------
    // GENERATE SUMMARY
    // ------------------------------------------

    const totalDuration = Date.now() - startTime;
    const successCount = tasks.filter(t => t.success).length;
    const failCount = tasks.filter(t => !t.success).length;

    // Calculate next run time
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + 6);
    // Round to nearest 6-hour mark
    const nextHour = Math.ceil(nextRun.getHours() / 6) * 6;
    nextRun.setHours(nextHour, 0, 0, 0);

    const summary = [
      `✅ Cron job completed in ${(totalDuration / 1000).toFixed(1)}s`,
      `Tasks: ${successCount} passed, ${failCount} failed`,
      `Price checks: ${(tasks.find(t => t.task === 'price_monitor')?.details?.checked as number) || 0}`,
      `Prices updated: ${(tasks.find(t => t.task === 'price_monitor')?.details?.updated as number) || 0}`,
      `Next run: ${nextRun.toISOString()}`,
    ].join(' | ');

    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║  ✅ CAREHUB CRON JOB COMPLETED                  ║');
    console.log(`║  Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`║  Tasks: ${successCount}/${tasks.length} passed`);
    console.log(`║  Next run: ${nextRun.toLocaleString()}`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');

    const result: CronResult = {
      success: failCount === 0,
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      tasks,
      summary,
      nextRun: nextRun.toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron] Fatal error:', errorMsg);

    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      tasks,
      summary: `❌ Cron job failed: ${errorMsg}`,
      nextRun: '',
    }, { status: 500 });
  }
}
