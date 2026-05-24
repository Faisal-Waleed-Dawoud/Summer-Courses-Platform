'use client'

import React, { useActionState, useEffect, useRef, useState } from 'react'
import Input from '@/components/input'
import Modal from '@/components/modal'
import Submit from '@/components/submit'
import Form from 'next/form'
import { CreateCourseFormState } from '../lib/types'
import { createCourse, getAuthParams } from '../lib/actions'
import { File, UploadIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import Spinner from '@/components/spinner'
import { upload } from '@imagekit/next'



function CreateCourseModal({ handleOpen }: { handleOpen: () => void }) {

    const [file, setFile] = useState<File | null>(null);
    const fileRef = useRef<HTMLInputElement | null>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) {
            return 
        }
        setFile(e.target.files[0]);
    }

    function handleClearFile() {
        setFile(null);
        if (fileRef.current === null) {
            return
        }
        fileRef.current.value = "";
    }

    const initalState: CreateCourseFormState = {
        errors: {
            courseName: '',
            courseCode: '',
            syllabus: ''
        },
        payload: undefined,
        status: 0
    }


    const [isUploading, setIsUploading] = useState(false)
    const [state, formAction, isPending] = useActionState(createCourse, initalState)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formElement = e.currentTarget
        if (!file) {
            toast.error("Please upload the syllabus")
            return
        }

        setIsUploading(true)

        try {
            const auth = await getAuthParams()
            if (!auth) {
                throw new Error("Could not authenticate file upload")
            }
            
            const result = await upload({
                file,
                fileName: file.name,
                publicKey: auth.publicKey,
                signature: auth.signature,
                token: auth.token,
                expire: auth.expire,
                folder: auth.folder
            })

            if (!result.url) {
                throw new Error("Upload succeeded, but no URL was returned")
            }
            const syllabusUrl = result.url

            
            const submitData = new FormData(formElement)
            submitData.set("syllabus-url", syllabusUrl)

            React.startTransition(() => {
                formAction(submitData)
            })

            setFile(null)
            if (fileRef.current) {
                fileRef.current.value = ""
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : String(err))
        } finally {
            setIsUploading(false)
        }
    }

    useEffect(() => {
        if (state?.status === 200) {
            toast.success('Course created successfully')
        }
        if (state?.status === 400 || state?.status === 401 || state?.status === 500) {
            toast.error(state?.errors?.unknownError || 'Unable to create course')
        }
    }, [state])

    return (
        <Modal title='Create Course' handleOpen={handleOpen}>
            <form onSubmit={handleSubmit} className='flex flex-col gap-2 justify-between'>
                {state?.errors?.unknownError && <p className='text-red-500'>{state.errors.unknownError}</p>}
                <div className='grid columns-2 gap-3'>
                    <div className='flex gap-2 items-center'>
                        <Input
                            title='Course Name'
                            id='CName'
                            name='course-name'
                            errorName='courseName'
                            state={state}
                        />
                        <Input
                            title='Course Code'
                            id='CCode'
                            name='course-code'
                            errorName='courseCode'
                            state={state}
                        />
                    </div>
                    <div>
                        <span>Syllabus <span className='text-red-500'>*</span></span>
                        <div className={`${file ? "hidden" : "block"} mt-1`}>
                            <label htmlFor='syllabus' className={`min-h-24 p-3 flex gap-2 items-center justify-center flex-col outline-dashed outline-4 cursor-pointer rounded-md duration-300 ${state?.errors.syllabus ? "outline-red-400" : ""}`}>
                                <UploadIcon></UploadIcon>
                                <p className='text-sm text-[#888]'>syllabus format should be pdf only</p>
                            </label>
                            <input accept='.pdf' onChange={handleFileChange} type="file" name="syllabus" className='hidden' id="syllabus" />
                            {state?.errors.syllabus && <p className='text-red-400'>{state.errors.syllabus}</p>}
                        </div>
                            {file && <div className='bg-gray-100 flex justify-between items-center p-2 rounded-lg shadow-custom'>
                                <div className='flex items-center gap-2'>
                                    <File className='text-2xl'></File>
                                    <div>
                                        <h3>{file.name}</h3>
                                        <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button className='hover:text-white hover:bg-red-400 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer duration-300' onClick={handleClearFile}><X></X></button>
                            </div>}
                    </div>
                    <Button disabled={isUploading || isPending} variant='default' type='submit'>
                        {(isUploading || isPending) && <Spinner />}
                        Create Course
                    </Button>
                </div>
            </form>
        </Modal>
    )
}

export default CreateCourseModal
