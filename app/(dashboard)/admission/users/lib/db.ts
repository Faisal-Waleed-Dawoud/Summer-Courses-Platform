"use server"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { authorizeDbCall } from "@/lib/db/calls"
import { authorize } from "@/lib/db/users"
import { MAX_ROWS } from "@/lib/types"
import { getCurrentUser } from "@/lib/utils"
import pool from '@/lib/db/pool'



const getUsersCache = async (query?: string, pageNumber?:number) => {
    "use cache"
    
    let offset = 0;
    if (pageNumber) {
        offset = --pageNumber * MAX_ROWS;
    }
    try {
        if (query) {
            const { rows: users } = await pool.query(`
                SELECT * FROM "user" WHERE 
                ("firstName" LIKE CONCAT('%', $1::text , '%')
                OR "lastName" LIKE CONCAT('%', $2::text , '%')
                OR email LIKE CONCAT('%', $3::text , '%')
                OR role LIKE CONCAT('%', $4::text , '%'))
                LIMIT $5 OFFSET $6`, [query, query, query, query, MAX_ROWS, offset])
                
                return users
        } else {
            const { rows: users } = await pool.query(`SELECT * FROM "user" LIMIT $1 OFFSET $2`, [MAX_ROWS, offset])
            
            return users;
        }

    } catch (error) {
        return error;
    }
}

const getAllUsersCache = async(query?:string) => {
    "use cache"
    try {
        if (query) {
            const { rows: users } = await pool.query(`
                SELECT "firstName", "lastName", email, role FROM "user" WHERE 
                ("firstName" LIKE CONCAT('%', $1::text , '%')
                OR "lastName" LIKE CONCAT('%', $2::text , '%')
                OR email LIKE CONCAT('%', $3::text , '%')
                OR role LIKE CONCAT('%', $4::text , '%'))
                `, [query, query, query, query])
                
                return users
        } else {
            const { rows: users } = await pool.query("SELECT \"firstName\", \"lastName\", email, role FROM \"user\"")
            
            return users;
        }

    } catch (error) {
        return error;
    }
}

export const getAllUsers = async(query?:string) => {
    return await authorizeDbCall("user:read", getAllUsersCache, query)
}

export const getUsers = async(query?:string, pageNumber?: number) => {
    return await authorizeDbCall("user:read", getUsersCache, query, pageNumber)
}

export const deleteUser = async(id: string) => {
    
    const user = await getCurrentUser({fullUser: false, redirectIfNotFound: true})
    if (!user) {
        return
    }

    const isAuthorized = await authorize(user.role, "user:delete")
    if (isAuthorized === undefined) {
        return
    }

    try {
        await pool.query(`DELETE FROM "user" WHERE id = $1`, [id])
    } catch(error) {
        return error
    }
}

const getUsersCountCache = async(query?:string, ) => {
    "use cache"
    try {
        if (query) {
            const { rows: count } = await pool.query(`
                SELECT COUNT(*) FROM "user" WHERE 
                ("firstName" LIKE CONCAT('%', $1::text , '%')
                OR "lastName" LIKE CONCAT('%', $2::text , '%')
                OR email LIKE CONCAT('%', $3::text , '%')
                OR role LIKE CONCAT('%', $4::text , '%'))`, [query, query, query, query])
            return count[0]["count"]
        }
        const { rows: count } = await pool.query("SELECT COUNT(*) FROM \"user\"")
        return count[0]["count"]
    } catch(error) {
        return error
    }
}

export const getUsersCount = async(query?:string) => {
    return await authorizeDbCall("user:read", getUsersCountCache, query)
}