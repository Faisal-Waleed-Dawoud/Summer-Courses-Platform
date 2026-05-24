import React from 'react'
import { getEnrollmentRequests, getEnrollmentRequestsCount } from './lib/db'
import { MAX_ROWS, Status } from '@/lib/types'
import { EnrollmentRequests } from './lib/types'
import Pagination from '@/components/pagination'
import Table from '@/components/dashboard/Table'
import Search from '@/components/search'
import { Enrollments } from '../courses/lib/types'
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Enrollments",
};

async function Page({searchParams} : {searchParams: Promise<{query?: string, page?: number}>}) {

    const {query, page} = await searchParams

    const pageNumber = page || 1
    const enrollmentRequestsCount = await getEnrollmentRequestsCount(query)
    const pages = Math.ceil(enrollmentRequestsCount / MAX_ROWS)
    const enrollmentRequests = await getEnrollmentRequests(query, pageNumber) as EnrollmentRequests[]

        const rows = []
    for (let i = 0; i < enrollmentRequests.length; i++) {
        let statusColor = ""
        if (enrollmentRequests[i].status === Status.approved) {
            statusColor = "bg-green-200"
        } else if (enrollmentRequests[i].status === Status.pending) {
            statusColor = "bg-yellow-200"
        } else if (enrollmentRequests[i].status === Status.rejected) {
            statusColor = "bg-red-200"
        } else if (enrollmentRequests[i].status === Enrollments.Completed) {
            statusColor = "bg-green-500 text-white"
        }


        rows.push(
        <tr key={i} className='hover:bg-[#eee] duration-300 border-b-2 border-b-gray-100'>
            <td className='table-custom-cell'>{enrollmentRequests[i].partner_uni_name}</td>
            <td className='table-custom-cell'>{enrollmentRequests[i].location}</td>
            <td className='table-custom-cell'>{enrollmentRequests[i].course_name}</td>
            <td className='table-custom-cell'>{enrollmentRequests[i].course_code}</td>
            <td className='table-custom-cell'><span className={`px-2 py-1 rounded-lg ${statusColor}`}>{enrollmentRequests[i].status}</span></td>
            <td className='table-custom-cell'>{enrollmentRequests[i].enrollment_date ? enrollmentRequests[i].enrollment_date : "TBA"}</td>
            <td className='table-custom-cell'>{enrollmentRequests[i].finishing_date ? enrollmentRequests[i].finishing_date : "TBA"}</td>
            <td className='table-custom-cell'>{enrollmentRequests[i].grade ? enrollmentRequests[i].grade : "TBA"}</td>
        </tr>)
    }

    return (
        <>
            <Table>
                <Table.Header className="mb-3 flex justify-between">
                    <Table.Title text="Enrollment Requests"></Table.Title>
                    <div className="flex gap-2 items-center">
                        <Search text="search for an enrollment"></Search>
                    </div>
                </Table.Header>
                <Table.Data pageNumber={pageNumber} pages={pages} className="w-full mb-3">
                    <thead>
                        <tr className="border-b-2 border-b-gray-100">
                            <td className="table-custom-cell">
                                University Name
                            </td>
                            <td className="table-custom-cell">
                                University Location
                            </td>
                            <td className="table-custom-cell">
                                Course Name
                            </td>
                            <td className="table-custom-cell">
                                Course Code
                            </td>
                            <td className="table-custom-cell">
                                Enrollment Status
                            </td>
                            <td className="table-custom-cell">
                                Enrollment Date
                            </td>
                            <td className="table-custom-cell">
                                Finishing Date
                            </td>
                            <td className="table-custom-cell">
                                Grade
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </Table.Data>
                <Pagination pageNumber={pageNumber} pageLimit={pages}></Pagination>
            </Table>
        </>
    )
}

export default Page
