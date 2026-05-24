"use client"
import React from 'react'
import { TrendingUp } from "lucide-react"
import { LabelList, Pie, PieChart, ResponsiveContainer } from "recharts"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { UniversitiesCoursesNumber } from '@/app/(dashboard)/admission/lib/types'
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";


type ChartConfig = {
    [key: string]: { label: string }
}

function Piechart({ props }: { props: UniversitiesCoursesNumber[] }) {

    const chartConfig: ChartConfig = {
        courses: {
            label: "Courses",
        }
    }

    const [index, setIndex] = useState(0);
    const hasData = props.length > 0

    const chartData: UniversitiesCoursesNumber[] = props.map((item, i) => {
        item["fill"] = `var(--chart-${i + 1})`
        chartConfig[item.uni_name] = { label: item.uni_name }

        return {
            ...item,
            courses_number: Number(item.courses_number)
        }
    })

    const texts = chartData.map((item) => `${item.uni_name} provides ${item.courses_number} courses`)

    useEffect(() => {
        if (!hasData) {
            return
        }

        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % texts.length)
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    return (
        <>
            <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                    <CardTitle>University Courses</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    {hasData ? (
                        <ChartContainer
                            config={chartConfig}
                            className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <ChartTooltip
                                        content={<ChartTooltipContent nameKey="courses" hideLabel />}
                                    />
                                    <Pie data={chartData} dataKey="courses_number">
                                        <LabelList
                                            dataKey="uni_name"
                                            className="fill-background"
                                            stroke="none"
                                            fontSize={12}
                                            formatter={(value: keyof typeof chartConfig) =>
                                                chartConfig[value]?.label
                                            }
                                        />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    ) : (
                        <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
                            No data to view.
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm">
                    <div className="leading-none font-medium">
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={index}
                                className="flex items-center gap-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.5 }}
                            >
                                <p>{texts[index]}</p>
                                <TrendingUp className="h-4 w-4" />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </CardFooter>
            </Card>
        </>
    )
}

export default Piechart
