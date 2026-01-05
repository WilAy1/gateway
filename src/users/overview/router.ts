import express from 'express';
import Table from '../../db/query';
import { sendErrroResponse, sendSuccessResponse } from '../../utils/responseHandler';

export const overviewRouter = express.Router();

overviewRouter.get('', async (req, res) => {
    try {
        const table = new Table("transactions");
        const result  = await table.customQuery(`
                    WITH base AS (
                SELECT *
                FROM transactions
            ),
            monthly AS (
                SELECT
                    DATE_TRUNC('month', created_at) AS month,
                    COUNT(*) AS monthly_tx
                FROM base
                GROUP BY 1
            )
            SELECT
                -- overall metrics
                (SELECT COUNT(*) FROM base) AS total_transactions,
                (SELECT COUNT(*) FROM base WHERE created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day') AS today_transactions,
                (SELECT COUNT(*) FROM base WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND created_at < CURRENT_DATE + INTERVAL '1 day') AS last_7_days_transactions,
                (SELECT COUNT(DISTINCT customer_id)
                 FROM base
                 WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS active_customers,
                (SELECT COUNT(DISTINCT customer_id)
                 FROM base
                 WHERE created_at >= CURRENT_DATE - INTERVAL '1 hour') AS hourly_active_customers
        `, []);


        const result2 = await table.customQuery(`
            WITH months AS (
                -- Explicitly define current and previous month
                SELECT DATE_TRUNC('month', CURRENT_DATE) AS month
                UNION ALL
                SELECT DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
            ),
            monthly_amounts AS (
                SELECT
                    DATE_TRUNC('month', created_at) AS month,
                    SUM(amount) AS total_amount
                FROM transactions
                WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                GROUP BY 1
            ),
            combined AS (
                SELECT
                    m.month,
                    COALESCE(ma.total_amount, 0) AS total_amount
                FROM months m
                LEFT JOIN monthly_amounts ma
                    ON m.month = ma.month
            )
            SELECT
                MAX(CASE WHEN month = DATE_TRUNC('month', CURRENT_DATE)
                    THEN total_amount END) AS current_month_amount,

                MAX(CASE WHEN month = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                    THEN total_amount END) AS previous_month_amount,

                CASE
                    WHEN MAX(CASE WHEN month = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                                  THEN total_amount END) = 0
                    THEN 0
                    ELSE ROUND(
                        (
                            MAX(CASE WHEN month = DATE_TRUNC('month', CURRENT_DATE)
                                     THEN total_amount END)
                          -
                            MAX(CASE WHEN month = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                                     THEN total_amount END)
                        ) * 100.0
                        /
                        MAX(CASE WHEN month = DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                                 THEN total_amount END),
                        2
                    )
                END AS mom_change_pct
            FROM combined
        `, []);

        const statusChartResult = await table.customQuery(`
            SELECT
              status,
              COUNT(*) AS count
            FROM (
              SELECT
                CASE
                  WHEN status = 'completed' THEN 'Completed'
                  WHEN status IN ('awaiting_payment', 'awaiting_confirmation', 'initialized') THEN 'Pending'
                  WHEN status = 'cancelled' THEN 'Cancelled'
                END AS status
              FROM transactions
            ) t
            WHERE status IS NOT NULL
            GROUP BY status;                
        `, []);

        const volumeChartResult = await table.customQuery(`
                WITH days AS (
                SELECT
                    generate_series(
                        DATE_TRUNC('week', CURRENT_DATE),
                        DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days',
                        INTERVAL '1 day'
                    )::date AS day
            ),
            daily_amounts AS (
                SELECT
                    DATE(created_at) AS day,
                    SUM(amount) AS total_amount
                FROM transactions
                WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
                  AND created_at <  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
                GROUP BY 1
            )
            SELECT
                d.day,
                TO_CHAR(d.day, 'Dy') AS date,
                COALESCE(da.total_amount, 0) AS volume
            FROM days d
            LEFT JOIN daily_amounts da
                ON d.day = da.day
            ORDER BY d.day;
        `, [])
        
        const final = Object.assign(result['rows'][0], result2['rows'][0]);

        return sendSuccessResponse(res, {
            stats: final,
            status_metric: statusChartResult['rows'],
            volume_metric: volumeChartResult['rows']
        });
    }
    catch {
        return sendErrroResponse(res, "An error occured while fetching data");
    }

});


// async function randFunc(){
//     const table = new Table("transactions");
//     const result  = await table.customQuery(`
//          SELECT
//     COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,

//     COUNT(*) FILTER (
//         WHERE status IN ('awaiting_payment', 'awaiting_confirmation', 'initialized')
//     ) AS pending_count,

//     COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count
// FROM transactions;

// `, []);
            
            
//         const result2 = await table.customQuery(`
//         WITH days AS (
//     SELECT
//         generate_series(
//             DATE_TRUNC('week', CURRENT_DATE),
//             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days',
//             INTERVAL '1 day'
//         )::date AS day
// ),
// daily_amounts AS (
//     SELECT
//         DATE(created_at) AS day,
//         SUM(amount) AS total_amount
//     FROM transactions
//     WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
//       AND created_at <  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
//     GROUP BY 1
// )
// SELECT
//     d.day,
//     TO_CHAR(d.day, 'Dy') AS day_name,
//     COALESCE(da.total_amount, 0) AS transaction_amount
// FROM days d
// LEFT JOIN daily_amounts da
//     ON d.day = da.day
// ORDER BY d.day;

//         `, [])

//     console.log(result['rows'])
//     console.log(result2['rows'])
// }

// randFunc();


