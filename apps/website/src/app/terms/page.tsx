import { Container, SectionHeading, Badge } from "@/components/ui/Section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and Conditions governing participation in Global Freedom Worldwide (GFW) programs and services.",
};

const sections = [
  {
    title: "1. Membership Registration",
    items: [
      "A non-refundable registration fee of ₦3,500 is required to activate membership.",
      "Members must make their first weekly contribution within 48 hours of registration.",
      "Failure to make the first contribution within the stipulated time will result in automatic account deactivation. Reactivation requires a fresh registration and payment of a new registration fee.",
      "Members are responsible for ensuring that all information provided during registration is accurate and complete.",
    ],
  },
  {
    title: "2. Weekly Contributions",
    items: [
      "Weekly contributions must be paid into the assigned virtual account on or before 11:59 PM every Friday.",
      "Contributions received after the deadline shall attract a default penalty equal to 100% of the weekly contribution.",
      "Any member who contributes less than the required amount will have their account suspended until the outstanding balance is paid.",
      "The default penalty is mandatory and non-negotiable.",
      "A ₦2,000 administrative fee is required before a suspended account can be reactivated.",
      "Manual payment uploads may require 24-48 hours for verification.",
    ],
  },
  {
    title: "3. Empowerment Qualification",
    items: [
      "Members must contribute a minimum total of ₦60,000 before becoming eligible for empowerment consideration.",
      "Empowerment is available only after 30 weeks of consistent contributions.",
      "To qualify for the ₦100,000 empowerment package and food incentives, a member must have at least one active referral who remains active for a minimum of 6 months.",
      "Members must also purchase and own an official GFW branded T-shirt to qualify for food empowerment incentives.",
      "Members without an active referral within 8 weeks of registration may not qualify for selected incentive programs.",
    ],
  },
  {
    title: "4. Fast-Track Program",
    items: [
      "Fast-Track members must register 5 active referrals within 30 days of activation.",
      "Failure to meet this requirement will result in removal from the Fast-Track Program.",
      "The five referrals must remain active for at least 3 months.",
      "All five referrals must also complete 12 weeks of active participation before the member's 16-week maturity.",
    ],
  },
  {
    title: "5. Account Integrity and Compliance",
    items: [
      "All payments and documents submitted must be genuine and verifiable.",
      "Submission of false payment receipts or fraudulent documents will result in immediate account termination without refund.",
      "Payments that cannot be automatically verified may require additional evidence, including bank statements or other supporting documents.",
    ],
  },
  {
    title: "6. Account Suspension",
    items: [
      "Accounts with more than 4 weeks of missed contributions may be suspended.",
      "Suspended members may lose referral and network benefits, which may affect empowerment eligibility.",
      "Suspension remains until all outstanding obligations have been settled.",
    ],
  },
  {
    title: "7. Withdrawals",
    items: [
      "Members requesting empowerment payments must first pay a ₦2,500 clearance fee.",
      "Approved withdrawal requests will be processed within 4 business days, subject to verification.",
      "GFW reserves the right to delay processing where additional verification is necessary.",
    ],
  },
  {
    title: "8. Account Termination and Transfer",
    items: [
      "Voluntary account termination requires payment of a ₦5,000 processing fee.",
      "Account ownership transfer also requires payment of a ₦5,000 transfer fee.",
      "A transferred account does not inherit the previous owner's referrals or downline.",
    ],
  },
  {
    title: "9. Bulk Accounts",
    items: [
      "Bulk account packages range from 30 accounts to 1,000 accounts.",
      "Individuals, churches, cooperatives, companies, and organizations interested in bulk accounts must contact GFW management to negotiate an approved payment plan.",
      "Bulk account holders who fail to establish an approved payment plan but continue making contributions may have all contributions refunded at the end of the contribution cycle, although food incentive benefits may still apply.",
    ],
  },
  {
    title: "10. Death of a Member",
    items: [
      "Every member must provide a valid next of kin during registration.",
      "In the event of a member's death, the verified next of kin may claim the deceased member's total contributions, subject to verification.",
      "If the member dies before completing 30 weeks of contributions, the additional 50% empowerment benefit shall not be payable.",
    ],
  },
  {
    title: "11. Limitation of Liability",
    content:
      "GFW shall not be liable for losses arising from incorrect account or banking information supplied by members, errors made during registration, delays caused by banks, payment processors, or technical system failures, or circumstances beyond the reasonable control of GFW. Participation in the platform is voluntary, and every member agrees to comply with all applicable rules and policies.",
  },
  {
    title: "12. Policy Amendments",
    items: [
      "GFW reserves the right to amend these Terms and Conditions at any time to improve operations or comply with applicable laws and regulations.",
      "Members will be notified of major policy changes through official communication channels.",
    ],
  },
];

export default function Terms() {
  return (
    <main className="min-h-screen bg-brand-cream dark:bg-slate-950 pt-32">
      <section className="border-b border-brand-primary/10 dark:border-slate-800 bg-gradient-to-b from-brand-primary/[0.06] to-brand-cream dark:from-blue-950/20 dark:to-slate-950 px-6 pb-16 pt-10">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Badge>Legal</Badge>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-brand-dark dark:text-slate-100 sm:text-5xl">
              Terms &{" "}
              <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent italic">
                Conditions
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-light leading-relaxed text-brand-muted dark:text-slate-400">
              These Terms and Conditions govern participation in the programs and
              services provided by Global Freedom Worldwide (GFW).
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 rounded-2xl border border-brand-primary/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <p className="text-xs text-brand-muted dark:text-slate-400">
              Last Updated: August 3, 2026
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-dark dark:text-slate-300">
              By registering on the platform, every member agrees to comply with
              these Terms and Conditions.
            </p>
          </div>

          {sections.map((section, index) => (
            <div
              key={section.title}
              className="mb-6 rounded-2xl border border-brand-primary/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm"
            >
              <h3 className="font-display text-lg font-bold text-brand-dark dark:text-slate-100 mb-4">
                {section.title}
              </h3>
              {section.items && (
                <ul className="space-y-3">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm leading-relaxed text-brand-muted dark:text-slate-400"
                    >
                      <span className="font-bold text-brand-primary shrink-0 mt-0.5">
                        {i + 1}.
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {section.content && (
                <p className="text-sm leading-relaxed text-brand-muted dark:text-slate-400">
                  {section.content}
                </p>
              )}
            </div>
          ))}

          <div className="rounded-2xl border border-amber-300/30 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950/20 p-7">
            <h3 className="font-display text-lg font-bold text-amber-700 dark:text-amber-400 mb-3">
              Important Notice
            </h3>
            <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-400">
              For members on the 16-week Fast-Track Program, all required
              referrals must have remained active for at least 12 weeks before
              the member becomes eligible for maturity and empowerment benefits.
            </p>
          </div>
        </div>
      </Container>
    </main>
  );
}
