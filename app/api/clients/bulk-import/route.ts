// ============================================================================
// Bulk Import Clients API Route
// ============================================================================
// Handles bulk importing clients from phone contacts
// ============================================================================

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ContactInput {
  name: string
  phone: string
}

interface ImportResult {
  imported: Array<{
    id: string
    name: string
    phone: string | null
  }>
  skipped: Array<{
    name: string
    phone: string
    reason: string
  }>
}

// POST /api/clients/bulk-import - Bulk import clients from contacts
export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { contacts } = body

    // Validate input
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'Contacts must be a non-empty array' },
        { status: 400 }
      )
    }

    if (contacts.length > 100) {
      return NextResponse.json(
        { error: 'Cannot import more than 100 contacts at once' },
        { status: 400 }
      )
    }

    // Validate and normalize contacts
    const phoneRegex = /^[6-9]\d{9}$/
    const validContacts: ContactInput[] = []
    const skipped: ImportResult['skipped'] = []

    for (const contact of contacts) {
      const { name, phone } = contact

      // Validate name
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        skipped.push({
          name: name || 'Unknown',
          phone: phone || '',
          reason: 'Name must be at least 2 characters',
        })
        continue
      }

      // Validate phone
      if (!phone || typeof phone !== 'string') {
        skipped.push({
          name: name.trim(),
          phone: '',
          reason: 'Phone number is required',
        })
        continue
      }

      // Normalize phone (remove spaces, dashes, etc.)
      const normalizedPhone = phone.replace(/\D/g, '')

      // Remove country code if present (91 for India)
      const cleanPhone = normalizedPhone.startsWith('91') && normalizedPhone.length === 12
        ? normalizedPhone.slice(2)
        : normalizedPhone

      // Validate Indian mobile format
      if (!phoneRegex.test(cleanPhone)) {
        skipped.push({
          name: name.trim(),
          phone: phone,
          reason: 'Invalid Indian mobile number format',
        })
        continue
      }

      validContacts.push({
        name: name.trim(),
        phone: cleanPhone,
      })
    }

    // If no valid contacts, return early
    if (validContacts.length === 0) {
      return NextResponse.json({
        imported: [],
        skipped,
        message: 'No valid contacts to import',
      })
    }

    // Fetch existing client phone numbers for this trainer to detect duplicates
    const { data: existingClients, error: fetchError } = await supabase
      .from('clients')
      .select('phone')
      .eq('trainer_id', user.id)
      .not('phone', 'is', null)

    if (fetchError) {
      console.error('Error fetching existing clients:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check for duplicates' },
        { status: 500 }
      )
    }

    // Create a set of existing phone numbers for fast lookup
    const existingPhones = new Set(
      existingClients?.map((c) => c.phone).filter(Boolean) || []
    )

    // Filter out duplicates
    const contactsToImport = validContacts.filter((contact) => {
      if (existingPhones.has(contact.phone)) {
        skipped.push({
          name: contact.name,
          phone: contact.phone,
          reason: 'Phone number already exists',
        })
        return false
      }
      return true
    })

    // If no contacts to import after filtering, return early
    if (contactsToImport.length === 0) {
      return NextResponse.json({
        imported: [],
        skipped,
        message: 'All contacts were duplicates or invalid',
      })
    }

    // Bulk insert clients (rate set to 0, trainer will update later)
    const clientsToInsert = contactsToImport.map((contact) => ({
      trainer_id: user.id,
      name: contact.name,
      phone: contact.phone,
      current_rate: 0, // No rate set during import
      balance: 0,
      credit_balance: 0,
    }))

    const { data: insertedClients, error: insertError } = await supabase
      .from('clients')
      .insert(clientsToInsert)
      .select('id, name, phone')

    if (insertError || !insertedClients) {
      console.error('Error inserting clients:', insertError)
      return NextResponse.json(
        { error: 'Failed to import clients' },
        { status: 500 }
      )
    }

    // Log to audit trail for each imported client
    const auditEntries = insertedClients.map((client) => ({
      trainer_id: user.id,
      client_id: client.id,
      action: 'CLIENT_ADD' as const,
      details: {
        name: client.name,
        phone: client.phone,
        source: 'contacts',
      },
      previous_balance: null,
      new_balance: 0,
    }))

    const { error: auditError } = await supabase
      .from('audit_log')
      .insert(auditEntries)

    if (auditError) {
      console.error('Error creating audit logs:', auditError)
      // Don't fail the request, just log it
    }

    return NextResponse.json({
      imported: insertedClients,
      skipped,
      message: `Successfully imported ${insertedClients.length} client${insertedClients.length === 1 ? '' : 's'}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/clients/bulk-import:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
