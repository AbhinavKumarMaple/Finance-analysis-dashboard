@echo off
echo Running Analytics Property-Based Tests...
echo.

echo Testing Balance Metrics (Property 3)...
call npm run test:run lib/analytics/balance.test.ts
echo.

echo Testing Cash Flow (Property 4)...
call npm run test:run lib/analytics/cashflow.test.ts
echo.

echo Testing Spending Breakdown (Properties 2 and 15)...
call npm run test:run lib/analytics/spending.test.ts
echo.

echo All analytics tests completed!
pause
