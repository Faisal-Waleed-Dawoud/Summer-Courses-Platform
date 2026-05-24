'use server'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Pool } from 'pg'
import { cacheTag, updateTag } from "next/cache"



// These details (host, user, etc...) should be stored in .env file and never 
// exposed in the client side
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})


export const insertUser = async (firstName: string, lastName: string, email: string, password: string, salt: string, role: string) => {

    try {
        await pool.query(`
            INSERT INTO "user" 
            ("firstName", "lastName", email, password, salt, role) 
            VALUES( $1 , $2, $3 , $4, $5, $6)
            `, [firstName, lastName, email, password, salt, role])

        const { rows: user } = await pool.query(`SELECT id FROM "user" WHERE email = $1`, [email])

        return (user as any[])[0].id
    } catch (error) {
        return error
    }
}

export const updateUser = async (userId: string, firstName: string, lastName: string, password: string, salt: string) => {
    try {
        await pool.query(`
            UPDATE "user"
            SET "firstName" = $1, 
            "lastName" = $2,
            password = $3,
            salt = $4
            WHERE id = $5
            `, [firstName, lastName, password, salt, userId])
            updateTag("user")
    } catch (error) {
        return error
    }
}

export const updateUserAndEmail = async (userId: string, firstName: string, lastName: string, email: string, password: string, salt: string) => {
    try {
        await pool.query(`
            UPDATE "user"
            SET "firstName" = $1, 
            "lastName" = $2,
            email = $3,
            password = $4,
            salt = $5
            WHERE id = $6
            `, [firstName, lastName, email, password, salt, userId])
    } catch (error) {
        return error
    }
}

// This function gets the user by email to check if it already exists before signning up
export const userExists = async (email: string) => {

    try {
        const { rows: user } = await pool.query(`SELECT * FROM "user" WHERE email = $1`, [email]);

        return (user as any[])[0]
    } catch (error) {
        return error;
    }
}

// This function should return the user details 
export const getUserFromSessionToken = async (sessionToken: string) => {
    "use cache"
    try {
        const { rows: userId } = await pool.query(`SELECT "userId", role FROM session WHERE token = $1`, [sessionToken])


        return (userId as any[])[0]
    } catch (error) {
        return error
    }
}

export const getUserById = async (id: string) => {
    "use cache"
    cacheTag("user")
    try {
        const { rows: user } = await pool.query(`SELECT * FROM "user" WHERE id = $1`, [id])
        return (user as any[])[0]
    } catch (error) {
        return error
    }
}


export const authorize = async (roleName: string, permission: string) => {
    "use cache"
    try {
        const { rows: result } = await pool.query(`
            SELECT name , role_name from permission p 
            JOIN roles_permission rp
            ON p.id = rp.permission_id where rp.role_name = $1 AND p.name = $2`, [roleName, permission])
        return (result as any[])[0]
    } catch (error) {
        return error
    }
}