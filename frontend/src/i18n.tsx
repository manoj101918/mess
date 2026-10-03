import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "te";

const en = {
  // navigation
  "nav.dashboard": "Dashboard",
  "nav.members": "Members",
  "nav.add": "Add",
  "nav.settings": "Settings",

  // status
  "status.active": "Active",
  "status.expiring": "Expiring",
  "status.expired": "Expired",

  // common
  "common.loading": "Loading…",
  "common.tryAgain": "Try again",
  "common.cancel": "Cancel",
  "common.pleaseWait": "Please wait…",
  "common.delete": "Delete",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.goBack": "Go back",
  "common.edit": "Edit",
  "common.couldNotSave": "Could not save",
  "common.couldNotLoad": "Could not load",
  "common.networkError": "Can't reach the server. Check your internet and try again.",
  "common.genericError": "Something went wrong. Please try again.",

  // days / durations
  "days.overdue": "{n} days overdue",
  "days.endedYesterday": "Ended yesterday",
  "days.endsToday": "Ends today",
  "days.endsTomorrow": "Ends tomorrow",
  "days.left": "{n} days left",
  "dur.month": "{n} month",
  "dur.months": "{n} months",
  "dur.day": "{n} day",
  "dur.days": "{n} days",

  // wake-up screen
  "wake.1": "Opening your mess book…",
  "wake.2": "Waking up the server…",
  "wake.3": "Free hosting takes a few seconds to wake up…",
  "wake.4": "Almost there…",
  "wake.slow": "Taking longer than usual. Check your internet connection.",

  // member row
  "row.whatsapp": "WhatsApp",
  "row.remindAgain": "Remind again",
  "row.renew": "Renew",
  "row.call": "📞 Call",
  "row.remindedToday": "✓ Reminded today",
  "row.noPlan": "No plan",
  "row.ends": "Ends {date}",
  "row.whatsappError": "Could not open WhatsApp",

  // dashboard
  "dash.active": "Active",
  "dash.expiringIn": "Expiring in {n} days",
  "dash.expired": "Expired",
  "dash.collectedIn": "Collected in {month}",
  "dash.expiringSoon": "Expiring soon",
  "dash.expiredRecent": "Expired (last 30 days)",
  "dash.noneExpiring": "👍 Nobody's plan ends in the next {n} days.",
  "dash.noneExpired": "🎉 No expired plans. Everyone is paid up.",
  "dash.noMembers": "No members yet",
  "dash.noMembersHint": "Tap + below to add your first member.",
  "dash.addMember": "+ Add member",
  "dash.switchLang": "తెలుగు",

  // members list
  "members.title": "Members",
  "members.search": "🔍  Search name or phone",
  "members.all": "All",
  "members.noMatch": "No members match",
  "members.noMatchHint": "Try a different name or filter.",
  "members.noMembersHint": "Tap + to add your first member.",

  // member form
  "mf.name": "Name",
  "mf.namePh": "e.g. Ravi Kumar",
  "mf.phone": "Phone number",
  "mf.phonePh": "10-digit mobile number",
  "mf.room": "Room / address (optional)",
  "mf.roomPh": "e.g. Room 101",
  "mf.notes": "Notes (optional)",
  "mf.notesPh": "e.g. Veg only, pays on the 1st",
  "mf.errName": "Please enter the member's name",
  "mf.errPhone": "Phone number must be 10 digits (starting with 6, 7, 8 or 9)",

  // subscription form
  "sf.plan": "Plan",
  "sf.choosePlan": "Choose a plan…",
  "sf.startDate": "Start date",
  "sf.endDate": "End date",
  "sf.endAuto": "Filled in automatically",
  "sf.resetAuto": "Reset to automatic",
  "sf.planRuns": "Plan runs {start} to {end}",
  "sf.amount": "Amount paid (₹)",
  "sf.paidBy": "Paid by",
  "sf.cash": "💵 Cash",
  "sf.upi": "📱 UPI",
  "sf.errPlan": "Please choose a plan",
  "sf.errStart": "Please choose a start date",
  "sf.errDates": "End date cannot be before start date",
  "sf.errAmount": "Amount must be 0 or more",

  // add / edit / renew
  "add.title": "Add member",
  "add.planFirst": "Add a plan first",
  "add.planFirstHint": "Before adding members, create at least one plan (like “Monthly”) in Settings.",
  "add.goSettings": "Go to Settings",
  "add.planPayment": "Plan & payment",
  "add.save": "Save member",
  "edit.title": "Edit member",
  "edit.save": "Save changes",
  "renew.title": "Renew plan",
  "renew.current": "Current: {plan} · ends {date} ({days})",
  "renew.save": "Save renewal",
  "renew.error": "Could not renew",

  // member detail
  "detail.title": "Member",
  "detail.phone": "Phone",
  "detail.room": "Room / address",
  "detail.notes": "Notes",
  "detail.since": "Member since",
  "detail.alreadyReminded": "✓ Reminder already sent today",
  "detail.whatsapp": "💬 WhatsApp",
  "detail.renew": "🔄 Renew plan",
  "detail.history": "Payment history",
  "detail.paidOn": "Paid {date} by {mode}",
  "detail.cash": "Cash",
  "detail.upi": "UPI",
  "detail.reminders": "Reminders sent",
  "detail.noReminders": "No reminders sent yet.",
  "detail.expiredNotice": "Expired notice",
  "detail.renewalReminder": "Renewal reminder",
  "detail.delete": "Delete member",
  "detail.deleteTitle": "Delete {name}?",
  "detail.deleteMsg": "This removes the member and all their payment history. This cannot be undone.",
  "detail.deleteError": "Could not delete",

  // settings
  "set.title": "Settings",
  "set.language": "Language",
  "set.plans": "Plans",
  "set.newPlan": "+ New plan",
  "set.noPlans": "No plans yet",
  "set.noPlansHint": "Tap “+ New plan” to add one, like “Monthly”.",
  "set.off": "Off",
  "set.newPlanTitle": "New plan",
  "set.editPlanTitle": "Edit plan",
  "set.planName": "Plan name",
  "set.planNamePh": "e.g. Monthly",
  "set.duration": "Duration",
  "set.unit": "Unit",
  "set.months": "Months",
  "set.days": "Days",
  "set.price": "Price (₹)",
  "set.errPlanName": "Please enter a plan name",
  "set.errDuration": "Duration must be at least 1",
  "set.errPrice": "Price must be 0 or more",
  "set.turnOff": "Turn off this plan",
  "set.turnOn": "Turn this plan back on",
  "set.turnOffTitle": "Turn off this plan?",
  "set.turnOffMsg":
    "It won't show up when adding or renewing members. Existing members and their history are kept. You can turn it back on any time.",
  "set.turnOffBtn": "Turn off",
  "set.mess": "Mess & reminders",
  "set.messName": "Mess name",
  "set.window": "Show as “expiring” this many days before the end date",
  "set.expiringTpl": "Message: plan ending soon",
  "set.expiredTpl": "Message: plan already ended",
  "set.placeholders": "These words get filled in automatically:",
  "set.tplTip": "You can write these messages in Telugu or English.",
  "set.saved": "Saved ✓",
  "set.saveSettings": "Save settings",
  "set.backup": "Backup",
  "set.backupText":
    "Download all members, payments, plans and reminders as an Excel file. Keep a copy safe, for example once a week.",
  "set.backupBtn": "⬇️ Download backup (Excel)",
};

export type TKey = keyof typeof en;

const te: Record<TKey, string> = {
  "nav.dashboard": "హోమ్",
  "nav.members": "సభ్యులు",
  "nav.add": "చేర్చు",
  "nav.settings": "సెట్టింగ్స్",

  "status.active": "కొనసాగుతోంది",
  "status.expiring": "ముగియనుంది",
  "status.expired": "ముగిసింది",

  "common.loading": "లోడ్ అవుతోంది…",
  "common.tryAgain": "మళ్ళీ ప్రయత్నించండి",
  "common.cancel": "రద్దు",
  "common.pleaseWait": "దయచేసి ఆగండి…",
  "common.delete": "తొలగించు",
  "common.save": "సేవ్ చేయి",
  "common.saving": "సేవ్ అవుతోంది…",
  "common.goBack": "వెనక్కి",
  "common.edit": "మార్చు",
  "common.couldNotSave": "సేవ్ చేయలేకపోయాం",
  "common.couldNotLoad": "లోడ్ చేయలేకపోయాం",
  "common.networkError": "సర్వర్‌కు కనెక్ట్ కాలేదు. ఇంటర్నెట్ చూసి మళ్ళీ ప్రయత్నించండి.",
  "common.genericError": "ఏదో పొరపాటు జరిగింది. మళ్ళీ ప్రయత్నించండి.",

  "days.overdue": "{n} రోజులు దాటింది",
  "days.endedYesterday": "నిన్న ముగిసింది",
  "days.endsToday": "ఈరోజు ముగుస్తుంది",
  "days.endsTomorrow": "రేపు ముగుస్తుంది",
  "days.left": "ఇంకా {n} రోజులు",
  "dur.month": "{n} నెల",
  "dur.months": "{n} నెలలు",
  "dur.day": "{n} రోజు",
  "dur.days": "{n} రోజులు",

  "wake.1": "మీ మెస్ బుక్ తెరుస్తున్నాం…",
  "wake.2": "సర్వర్ ప్రారంభమవుతోంది…",
  "wake.3": "ఉచిత సర్వర్ మొదలవడానికి కొన్ని సెకన్లు పడుతుంది…",
  "wake.4": "దాదాపు అయిపోయింది…",
  "wake.slow": "సాధారణం కంటే ఎక్కువ సమయం పడుతోంది. ఇంటర్నెట్ కనెక్షన్ చూడండి.",

  "row.whatsapp": "వాట్సాప్",
  "row.remindAgain": "మళ్ళీ పంపు",
  "row.renew": "రెన్యూ",
  "row.call": "📞 కాల్",
  "row.remindedToday": "✓ ఈరోజు గుర్తుచేశారు",
  "row.noPlan": "ప్లాన్ లేదు",
  "row.ends": "ముగింపు {date}",
  "row.whatsappError": "వాట్సాప్ తెరవలేకపోయాం",

  "dash.active": "కొనసాగుతున్నవి",
  "dash.expiringIn": "{n} రోజుల్లో ముగిసేవి",
  "dash.expired": "ముగిసినవి",
  "dash.collectedIn": "{month}లో వసూలు",
  "dash.expiringSoon": "త్వరలో ముగిసేవి",
  "dash.expiredRecent": "ముగిసినవి (గత 30 రోజులు)",
  "dash.noneExpiring": "👍 వచ్చే {n} రోజుల్లో ఎవరి ప్లాన్ ముగియదు.",
  "dash.noneExpired": "🎉 ముగిసిన ప్లాన్లు లేవు. అందరూ చెల్లించారు.",
  "dash.noMembers": "ఇంకా సభ్యులు లేరు",
  "dash.noMembersHint": "మొదటి సభ్యుడిని చేర్చడానికి కింద + నొక్కండి.",
  "dash.addMember": "+ సభ్యుడిని చేర్చు",
  "dash.switchLang": "English",

  "members.title": "సభ్యులు",
  "members.search": "🔍  పేరు లేదా ఫోన్ వెతకండి",
  "members.all": "అందరూ",
  "members.noMatch": "ఎవరూ దొరకలేదు",
  "members.noMatchHint": "వేరే పేరు లేదా ఫిల్టర్ ప్రయత్నించండి.",
  "members.noMembersHint": "మొదటి సభ్యుడిని చేర్చడానికి + నొక్కండి.",

  "mf.name": "పేరు",
  "mf.namePh": "ఉదా: రవి కుమార్",
  "mf.phone": "ఫోన్ నంబర్",
  "mf.phonePh": "10 అంకెల మొబైల్ నంబర్",
  "mf.room": "రూమ్ / చిరునామా (అవసరమైతే)",
  "mf.roomPh": "ఉదా: రూమ్ 101",
  "mf.notes": "గమనికలు (అవసరమైతే)",
  "mf.notesPh": "ఉదా: వెజ్ మాత్రమే, 1వ తేదీన చెల్లిస్తారు",
  "mf.errName": "సభ్యుని పేరు నమోదు చేయండి",
  "mf.errPhone": "ఫోన్ నంబర్ 10 అంకెలు ఉండాలి (6, 7, 8 లేదా 9తో మొదలవ్వాలి)",

  "sf.plan": "ప్లాన్",
  "sf.choosePlan": "ప్లాన్ ఎంచుకోండి…",
  "sf.startDate": "ప్రారంభ తేదీ",
  "sf.endDate": "ముగింపు తేదీ",
  "sf.endAuto": "ఆటోమేటిక్‌గా నింపబడుతుంది",
  "sf.resetAuto": "ఆటోమేటిక్‌కు మార్చు",
  "sf.planRuns": "ప్లాన్ {start} నుండి {end} వరకు",
  "sf.amount": "చెల్లించిన మొత్తం (₹)",
  "sf.paidBy": "చెల్లింపు విధానం",
  "sf.cash": "💵 నగదు",
  "sf.upi": "📱 UPI",
  "sf.errPlan": "ప్లాన్ ఎంచుకోండి",
  "sf.errStart": "ప్రారంభ తేదీ ఎంచుకోండి",
  "sf.errDates": "ముగింపు తేదీ ప్రారంభ తేదీ కంటే ముందు ఉండకూడదు",
  "sf.errAmount": "మొత్తం 0 లేదా అంతకంటే ఎక్కువ ఉండాలి",

  "add.title": "సభ్యుడిని చేర్చు",
  "add.planFirst": "ముందుగా ఒక ప్లాన్ చేర్చండి",
  "add.planFirstHint": "సభ్యులను చేర్చే ముందు సెట్టింగ్స్‌లో కనీసం ఒక ప్లాన్ (ఉదా: “Monthly”) చేర్చండి.",
  "add.goSettings": "సెట్టింగ్స్‌కు వెళ్ళండి",
  "add.planPayment": "ప్లాన్ & చెల్లింపు",
  "add.save": "సభ్యుడిని సేవ్ చేయి",
  "edit.title": "వివరాలు మార్చు",
  "edit.save": "మార్పులు సేవ్ చేయి",
  "renew.title": "ప్లాన్ రెన్యూ",
  "renew.current": "ప్రస్తుతం: {plan} · ముగింపు {date} ({days})",
  "renew.save": "రెన్యూ సేవ్ చేయి",
  "renew.error": "రెన్యూ చేయలేకపోయాం",

  "detail.title": "సభ్యుడు",
  "detail.phone": "ఫోన్",
  "detail.room": "రూమ్ / చిరునామా",
  "detail.notes": "గమనికలు",
  "detail.since": "చేరిన తేదీ",
  "detail.alreadyReminded": "✓ ఈరోజు ఇప్పటికే గుర్తుచేశారు",
  "detail.whatsapp": "💬 వాట్సాప్",
  "detail.renew": "🔄 ప్లాన్ రెన్యూ",
  "detail.history": "చెల్లింపుల చరిత్ర",
  "detail.paidOn": "{date}న {mode} ద్వారా చెల్లించారు",
  "detail.cash": "నగదు",
  "detail.upi": "UPI",
  "detail.reminders": "పంపిన రిమైండర్లు",
  "detail.noReminders": "ఇంకా రిమైండర్లు పంపలేదు.",
  "detail.expiredNotice": "ముగిసిన సమాచారం",
  "detail.renewalReminder": "రెన్యూ రిమైండర్",
  "detail.delete": "సభ్యుడిని తొలగించు",
  "detail.deleteTitle": "{name}ని తొలగించాలా?",
  "detail.deleteMsg": "ఈ సభ్యుడు, వారి చెల్లింపుల చరిత్ర అంతా తొలగిపోతుంది. దీన్ని తిరిగి పొందలేరు.",
  "detail.deleteError": "తొలగించలేకపోయాం",

  "set.title": "సెట్టింగ్స్",
  "set.language": "భాష",
  "set.plans": "ప్లాన్లు",
  "set.newPlan": "+ కొత్త ప్లాన్",
  "set.noPlans": "ఇంకా ప్లాన్లు లేవు",
  "set.noPlansHint": "“+ కొత్త ప్లాన్” నొక్కి ఒకటి చేర్చండి, ఉదా: “Monthly”.",
  "set.off": "ఆఫ్",
  "set.newPlanTitle": "కొత్త ప్లాన్",
  "set.editPlanTitle": "ప్లాన్ మార్చు",
  "set.planName": "ప్లాన్ పేరు",
  "set.planNamePh": "ఉదా: Monthly",
  "set.duration": "వ్యవధి",
  "set.unit": "నెలలు / రోజులు",
  "set.months": "నెలలు",
  "set.days": "రోజులు",
  "set.price": "ధర (₹)",
  "set.errPlanName": "ప్లాన్ పేరు నమోదు చేయండి",
  "set.errDuration": "వ్యవధి కనీసం 1 ఉండాలి",
  "set.errPrice": "ధర 0 లేదా అంతకంటే ఎక్కువ ఉండాలి",
  "set.turnOff": "ఈ ప్లాన్ ఆఫ్ చేయి",
  "set.turnOn": "ఈ ప్లాన్ మళ్ళీ ఆన్ చేయి",
  "set.turnOffTitle": "ఈ ప్లాన్ ఆఫ్ చేయాలా?",
  "set.turnOffMsg":
    "సభ్యులను చేర్చేటప్పుడు లేదా రెన్యూ చేసేటప్పుడు ఇది కనిపించదు. ఉన్న సభ్యులు, వారి చరిత్ర అలాగే ఉంటాయి. ఎప్పుడైనా మళ్ళీ ఆన్ చేయవచ్చు.",
  "set.turnOffBtn": "ఆఫ్ చేయి",
  "set.mess": "మెస్ & రిమైండర్లు",
  "set.messName": "మెస్ పేరు",
  "set.window": "ముగింపు తేదీకి ఎన్ని రోజుల ముందు “ముగియనుంది” అని చూపించాలి",
  "set.expiringTpl": "సందేశం: ప్లాన్ త్వరలో ముగుస్తుంది",
  "set.expiredTpl": "సందేశం: ప్లాన్ ముగిసింది",
  "set.placeholders": "ఈ పదాలు ఆటోమేటిక్‌గా నింపబడతాయి:",
  "set.tplTip": "ఈ సందేశాలను తెలుగులో లేదా ఇంగ్లీషులో రాయవచ్చు.",
  "set.saved": "సేవ్ అయింది ✓",
  "set.saveSettings": "సెట్టింగ్స్ సేవ్ చేయి",
  "set.backup": "బ్యాకప్",
  "set.backupText":
    "సభ్యులు, చెల్లింపులు, ప్లాన్లు, రిమైండర్లు అన్నీ Excel ఫైల్‌గా డౌన్‌లోడ్ చేయండి. వారానికి ఒకసారి కాపీ భద్రంగా ఉంచుకోండి.",
  "set.backupBtn": "⬇️ బ్యాకప్ డౌన్‌లోడ్ (Excel)",
};

const DICTS: Record<Lang, Record<TKey, string>> = { en, te };
const STORAGE_KEY = "mess-lang";

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === "te" ? "te" : "en";
  } catch {
    return "en";
  }
}

// Module-level copy so plain helpers (date formatting, API errors) can translate too.
let current: Lang = readStoredLang();

export function getLang(): Lang {
  return current;
}

export function translate(key: TKey, vars?: Record<string, string | number>): string {
  let text = DICTS[current][key] ?? en[key];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: typeof translate;
}

const I18nContext = createContext<I18n>({ lang: current, setLang: () => {}, t: translate });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);

  function setLang(next: Lang) {
    current = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode etc. — language just won't be remembered
    }
    setLangState(next);
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t: translate }}>{children}</I18nContext.Provider>;
}

/** Every component that shows text calls this, so it re-renders when the language changes. */
export function useI18n(): I18n {
  return useContext(I18nContext);
}
