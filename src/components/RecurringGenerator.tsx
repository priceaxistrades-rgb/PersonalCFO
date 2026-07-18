"use client";
import {useEffect} from "react";import {useSession} from "@/lib/session";
export function RecurringGenerator(){const{session,loading}=useSession();useEffect(()=>{if(loading||!session)return;const day=new Date().toISOString().slice(0,10),key=`pcfo:recurring-generated:${session.userId}:${day}`;try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,"1")}catch{}void fetch("/api/recurring/generate",{method:"POST"}).catch(()=>{})},[loading,session]);return null}
