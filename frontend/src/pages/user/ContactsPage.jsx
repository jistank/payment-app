import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addContact, getContacts, removeContact } from '../../api'
import ContactFormModal from '../../components/contacts/ContactFormModal'
import ContactTransactionsModal from '../../components/contacts/ContactTransactionsModal'
import PaymentFormModal from '../../components/payments/PaymentFormModal'
import TransactionDetailModal from '../../components/transactions/TransactionDetailModal'
import { useAuth } from '../../context/AuthContext'
import { usePayments } from '../../context/PaymentsContext'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { initials, money, sortContacts } from '../../lib/formatters'

export default function ContactsPage() {
  const { t } = useTranslation('app')
  const { token, user, refreshUser } = useAuth()
  const { transactions, refreshTransactions } = usePayments()

  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsError, setContactsError] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [contactsRefreshKey, setContactsRefreshKey] = useState(0)
  const [notice, setNotice] = useState('')
  const debouncedContactSearch = useDebouncedValue(contactSearch.trim(), 300)

  const [selectedContact, setSelectedContact] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [paymentForm, setPaymentForm] = useState(null)

  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [contactNickname, setContactNickname] = useState('')
  const [contactFormError, setContactFormError] = useState('')
  const [contactSubmitting, setContactSubmitting] = useState(false)

  const [removeContactModalOpen, setRemoveContactModalOpen] = useState(false)
  const [removeContactNickname, setRemoveContactNickname] = useState('')
  const [removeContactFormError, setRemoveContactFormError] = useState('')
  const [removeContactSubmitting, setRemoveContactSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    setContactsLoading(true)
    setContactsError('')

    getContacts(token, debouncedContactSearch, { signal: controller.signal })
      .then((data) => {
        if (!active) return
        setContacts(sortContacts(data ?? []))
        setContactsError('')
      })
      .catch((err) => {
        if (!active || err.name === 'AbortError') return
        setContactsError(err.message || t('contacts.errors.load'))
      })
      .finally(() => {
        if (active) setContactsLoading(false)
      })

    return () => {
      active = false
      // Cancel the in-flight request instead of merely ignoring its response.
      controller.abort()
    }
  }, [token, debouncedContactSearch, contactsRefreshKey, t])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timeout)
  }, [notice])

  function openContactModal() {
    setContactNickname('')
    setContactFormError('')
    setContactModalOpen(true)
  }

  function closeContactModal() {
    if (contactSubmitting) return
    setContactModalOpen(false)
  }

  function openRemoveContactModal() {
    setRemoveContactNickname('')
    setRemoveContactFormError('')
    setRemoveContactModalOpen(true)
  }

  function closeRemoveContactModal() {
    if (removeContactSubmitting) return
    setRemoveContactModalOpen(false)
  }

  async function handleAddContact(event) {
    event.preventDefault()
    setContactFormError('')
    setNotice('')

    const nickname = contactNickname.trim()
    if (!nickname) {
      setContactFormError(t('contacts.errors.nicknameRequired'))
      return
    }

    setContactSubmitting(true)
    let added = false

    try {
      await addContact(token, nickname)
      added = true
    } catch (err) {
      if (err.status === 404) {
        setContactFormError(t('contacts.errors.notRegistered'))
      } else {
        setContactFormError(err.message || t('contacts.errors.add'))
      }
    } finally {
      setContactSubmitting(false)
    }

    if (!added) return

    setContactModalOpen(false)
    setContactNickname('')
    setNotice(t('notices.contactAdded', { nickname }))
    setContactsRefreshKey((current) => current + 1)
  }

  async function handleRemoveContact(event) {
    event.preventDefault()
    setRemoveContactFormError('')
    setNotice('')

    const nickname = removeContactNickname.trim()
    if (!nickname) {
      setRemoveContactFormError(t('contacts.errors.nicknameRequired'))
      return
    }

    setRemoveContactSubmitting(true)

    try {
      const matches = await getContacts(token, nickname)
      const contact = matches.find(
        (item) => item.nickname.toLowerCase() === nickname.toLowerCase(),
      )
      if (!contact) {
        setRemoveContactFormError(t('contacts.errors.notFound'))
        return
      }

      await removeContact(token, contact.id)

      setRemoveContactModalOpen(false)
      setRemoveContactNickname('')
      setNotice(t('notices.contactRemoved', { nickname: contact.nickname }))
      setContactsRefreshKey((current) => current + 1)
    } catch (err) {
      setRemoveContactFormError(err.message || t('contacts.errors.remove'))
    } finally {
      setRemoveContactSubmitting(false)
    }
  }

  async function handlePaymentCompleted(mode, contact, amount) {
    setPaymentForm(null)
    setSelectedContact(null)

    setNotice(
      t(mode === 'pay' ? 'notices.paymentSent' : 'notices.requestSent', {
        amount: money.format(Number(amount)),
        nickname: contact.nickname,
      }),
    )

    await Promise.all([
      refreshTransactions(),
      mode === 'pay' ? refreshUser() : Promise.resolve(),
    ])
  }

  return (
    <>
      <section>
        <header className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              {t('contacts.title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t('contacts.subtitle')}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openRemoveContactModal}
              aria-label={t('contacts.removeContact')}
              className="grid h-11 w-11 place-items-center rounded-full border border-red-200 bg-white text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-100"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={openContactModal}
              aria-label={t('contacts.addContact')}
              className="grid h-11 w-11 place-items-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </header>

        <div className="relative mb-4">
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={contactSearch}
            onChange={(event) => setContactSearch(event.target.value)}
            placeholder={t('contacts.searchPlaceholder')}
            aria-label={t('contacts.searchPlaceholder')}
            className="w-full rounded border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {notice && (
          <p className="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
            {notice}
          </p>
        )}

        {contactsLoading && <p className="text-sm text-slate-500">{t('contacts.loading')}</p>}

        {!contactsLoading && contactsError && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {contactsError}
          </p>
        )}

        {!contactsLoading && !contactsError && contacts.length === 0 && (
          <p className="text-sm text-slate-500">
            {debouncedContactSearch ? t('contacts.emptySearch') : t('contacts.empty')}
          </p>
        )}

        <ul className="flex flex-col gap-2.5">
          {contacts.map((contact) => (
            <li key={contact.id} className="rounded border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setSelectedContact(contact)}
                className="flex w-full items-center gap-3 rounded px-3 py-3 text-left transition hover:bg-sky-50/50 focus:outline-none focus:ring-4 focus:ring-sky-100 sm:gap-4 sm:px-4"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-sky-100 text-sm font-extrabold text-sky-700">
                  {initials(contact.nickname)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {contact.nickname}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <ContactTransactionsModal
        contact={selectedContact}
        transactions={
          selectedContact
            ? transactions.filter(
                (transaction) => transaction.counterpartId === selectedContact.userId,
              )
            : []
        }
        currentUser={user}
        onSelectTransaction={setSelectedTransaction}
        onPay={(contact) => setPaymentForm({ mode: 'pay', contact })}
        onRequest={(contact) => setPaymentForm({ mode: 'request', contact })}
        onClose={() => setSelectedContact(null)}
      />

      <PaymentFormModal
        open={Boolean(paymentForm)}
        mode={paymentForm?.mode}
        contact={paymentForm?.contact}
        onClose={() => setPaymentForm(null)}
        onCompleted={handlePaymentCompleted}
      />

      <TransactionDetailModal
        transaction={selectedTransaction}
        currentUser={user}
        onClose={() => setSelectedTransaction(null)}
      />

      <ContactFormModal
        open={contactModalOpen}
        title={t('contacts.form.addTitle')}
        description={t('contacts.form.addDescription')}
        nickname={contactNickname}
        onNicknameChange={(event) => setContactNickname(event.target.value)}
        onSubmit={handleAddContact}
        onClose={closeContactModal}
        error={contactFormError}
        submitting={contactSubmitting}
        submitLabel={t('contacts.form.addSubmit')}
        submittingLabel={t('ui.adding')}
      />

      <ContactFormModal
        open={removeContactModalOpen}
        title={t('contacts.form.removeTitle')}
        description={t('contacts.form.removeDescription')}
        nickname={removeContactNickname}
        onNicknameChange={(event) => setRemoveContactNickname(event.target.value)}
        onSubmit={handleRemoveContact}
        onClose={closeRemoveContactModal}
        error={removeContactFormError}
        submitting={removeContactSubmitting}
        submitLabel={t('contacts.form.removeSubmit')}
        submittingLabel={t('ui.removing')}
        danger
      />
    </>
  )
}
