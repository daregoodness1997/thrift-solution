"use client";

import { Card, FadeInUp } from "@thrift/ui";
import { Scale, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

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
      "Manual payment uploads may require 24–48 hours for verification.",
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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[900px] p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Legal"
        badgeIcon={<Scale className="w-3.5 h-3.5 text-blue-500" />}
        heading="Terms &"
        accentText="Conditions"
        description="These Terms and Conditions govern participation in the programs and services provided by Global Freedom Worldwide (GFW)."
      />

      <FadeInUp delay={100}>
        <Card padding="1.5rem" className="mb-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Last Updated: August 3, 2026
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            By registering on the platform, every member agrees to comply with these Terms and Conditions.
          </p>
        </Card>
      </FadeInUp>

      {sections.map((section, index) => (
        <FadeInUp key={section.title} delay={150 + index * 50}>
          <Card padding="1.5rem" className="mb-4 rounded-3xl">
            <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-4">
              {section.title}
            </h3>
            {section.items && (
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
                  >
                    <span className="text-blue-500 font-bold mt-0.5 shrink-0">
                      {i + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {section.content && (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {section.content}
              </p>
            )}
          </Card>
        </FadeInUp>
      ))}

      <FadeInUp delay={150 + sections.length * 50}>
        <Card padding="1.5rem" className="mb-4 rounded-3xl border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <h3 className="font-display font-bold text-base sm:text-lg text-amber-700 dark:text-amber-400 mb-3">
            Important Notice
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
            For members on the 16-week Fast-Track Program, all required referrals must have remained active for at least 12 weeks before the member becomes eligible for maturity and empowerment benefits.
          </p>
        </Card>
      </FadeInUp>
    </div>
  );
}
