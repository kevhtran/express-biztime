const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
        const res = await db.query(`SELECT code, name FROM companies ORDER BY name`);

        return res.json({ "companies": res.rows })
    }
    catch (err) {
        return next(err);
    }
})

router.get('/:code', async (req, res, next) => {
    try {
        let { code } = req.params
        const compRes = await db.query(`SELECT code, name, description FROM companies WHERE code = $1`, [code]);
        const invResult = await db.query(
            `SELECT id
             FROM invoices
             WHERE comp_code = $1`,
            [code]
        );

        if (compRes.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404)
        };
        const company = compResult.rows[0];
        const invoices = invResult.rows;

        company.invoices = invoices.map(inv => inv.id);
        return res.json({ "company": compRes.rows[0] })
    }
    catch (err) {
        return next(err);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        let code = slugify(name, { lower: true });

        const compRes = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description]);


        return res.status(201).json({ "company": compRes[0] });
    }
    catch (err) {
        return next(err);
    }
})

router.put('/:code', async (req, res, next) => {
    try {
        let { code } = req.params
        const { name, description } = req.body;
        const result = await db.query(
            `UPDATE companies
             SET name=$1, description=$2
             WHERE code = $3
             RETURNING code, name, description`,
            [name, description, code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404)
        } else {
            return res.json({ "company": result.rows[0] });
        }
    }
    catch (err) {
        return next(err);
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        let { code } = req.params;

        const result = await db.query(
            `DELETE FROM companies
           WHERE code=$1
           RETURNING code`,
            [code]);

        if (result.rows.length == 0) {
            throw new ExpressError(`No such company: ${code}`, 404)
        } else {
            return res.json({ "status": "deleted" });
        }
    }
    catch (err) {
        return next(err);
    }
})

module.exports = router;
