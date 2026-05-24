'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */
import pool from '@/lib/db/pool'
import { cacheTag, updateTag } from "next/cache"



export const insertPartner = async(uniName: string, location: string, userId: string) => {
    try {
        await pool.query(`
            INSERT INTO partner_uni_admission 
            (partner_uni_name, location, user_id) 
            VALUES($1, $2, $3)`, [uniName, location, userId])
    } catch(error) {
        return error
    }
}

export const updatePartner = async(userId: string, uniName: string, location: string) => {
    try {
        await pool.query(`
            UPDATE partner_uni_admission
            SET partner_uni_name = $1,
            location = $2
            WHERE user_id = $3
            `, [uniName, location, userId])
            updateTag("partner")
    } catch(error) {
        return error
    }
}

export const getPartnerUni = async(userId: string) => {
    "use cache"
    cacheTag("partner")
    try {
        const { rows: user } = await pool.query(`
            SELECT * FROM partner_uni_admission WHERE user_id = $1
            `, [userId])
        return user[0]
    } catch(error) {
        return error
    }
}

