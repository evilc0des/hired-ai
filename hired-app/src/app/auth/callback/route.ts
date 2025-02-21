import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/supabaseServer'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    console.log(requestUrl)
    const { searchParams, origin } = requestUrl
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/profile'

    
    // // If this is the initial OAuth callback, redirect to the root
    // // This will trigger the middleware which will handle the access token
    // if (!requestUrl.hash) {
    //     return NextResponse.redirect(new URL('/', requestUrl.origin))
    // }

    // // Parse the hash fragment
    // const hashParams = new URLSearchParams(requestUrl.hash.substring(1))
    // const accessToken = hashParams.get('access_token')

    const supabase = await supabaseServer()

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
              // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
              return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
              return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
              return NextResponse.redirect(`${origin}${next}`)
            }
        }
        console.error('Error exchanging code for session:', error)
    }

    console.log('No code found')
    
    // Return the user to an error page with instructions
    return NextResponse.redirect(new URL('/login', requestUrl.origin))
} 