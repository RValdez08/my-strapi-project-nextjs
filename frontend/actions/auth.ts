"use server"
import {cookies} from 'next/headers'
import {redirect} from 'next/navigation'

import { registerUserService } from "@/lib/strapi"
import { SignupFormSchema, type FormState } from "@/validations/auth"
import z from "zod"

const cookieConfig = {
    maxAge: 60*60*24*7,
    path: '/',
    httpOnly: true,
    // domain: process.env.HOST ?? 'localhost',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
}
export async function registerUserAction(prevState: FormState,formdata: FormData): Promise<FormState>{
    console.log(`Hola desde la accion para el registro de usuarios`)
    const fields = {
        username: formdata.get('username') as string,
        password: formdata.get('password') as string,
        email: formdata.get('email') as string
    }
    console.log(fields)
    const validatedFields = SignupFormSchema.safeParse(fields)
    if(!validatedFields.success){
        const flattenedErrors = z.flattenError(validatedFields.error);
        console.log(`Validation errors: ${flattenedErrors}`);
        return {
            success: false,
            message: 'Validation error',
            strapiErrors: null,
            zodErrors: flattenedErrors.fieldErrors,
            data:{
                ...prevState.data,
                ...fields
            }
        }
    }
    const response = await registerUserService(validatedFields.data)
    if (!response || response.error) {
        return {
            success: false,
            message: 'Registration error',
            strapiErrors: response?.error,
            zodErrors: null,
            data: fields
        }
    }
    const cookieStore = await cookies();
    cookieStore.set('jwt', response.jwt, cookieConfig)
    redirect('/dashboard')
}