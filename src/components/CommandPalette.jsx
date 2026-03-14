import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ClipboardDocumentListIcon,
  HomeIcon,
  HomeModernIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

import {
  getApplicationsForProperty,
  getInvestments,
  getLeads,
  getManagedProperties,
  getProperties,
} from "../utils/api";
import { getInvestmentStrategyLabel, normalizeInvestmentStrategy } from "../utils/propertyStrategy";

const GROUP_ORDER = [
  "Quick Actions",
  "Properties",
  "Management",
  "Applications",
  "Tenants & Leases",
  "Leads",
  "Project Management",
  "Platform",
];

const toneStyles = {
  ink: "bg-ink-100 text-ink-700",
  verdigris: "bg-verdigris-50 text-verdigris-700",
  clay: "bg-clay-50 text-clay-700",
  sand: "bg-sand-100 text-sand-700",
};

const normalizeSearchText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const createEntry = ({
  id,
  group,
  title,
  subtitle = "",
  to,
  icon,
  tone = "ink",
  keywords = [],
  priority = 0,
  pinned = false,
}) => ({
  id,
  group,
  title,
  subtitle,
  to,
  icon,
  tone,
  priority,
  pinned,
  titleSearch: normalizeSearchText(title),
  searchText: normalizeSearchText([title, subtitle, ...keywords].filter(Boolean).join(" ")),
});

const getMatchScore = (entry, query) => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return entry.priority;
  }

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  if (!tokens.every((token) => entry.searchText.includes(token))) {
    return -1;
  }

  let score = entry.priority;

  if (entry.titleSearch.startsWith(normalizedQuery)) {
    score += 120;
  } else if (entry.titleSearch.includes(normalizedQuery)) {
    score += 80;
  } else if (entry.searchText.includes(normalizedQuery)) {
    score += 40;
  }

  tokens.forEach((token) => {
    if (entry.titleSearch.includes(token)) {
      score += 20;
    }
    if (entry.searchText.includes(token)) {
      score += 10;
    }
  });

  return score;
};

const buildQuickActions = (user) => {
  const actions = [
    createEntry({
      id: "quick-dashboard",
      group: "Quick Actions",
      title: "Open dashboard overview",
      subtitle: "Portfolio snapshot, priorities, and recent activity",
      to: "/dashboard",
      icon: HomeIcon,
      keywords: ["overview home portfolio"],
      priority: 200,
      pinned: true,
    }),
    createEntry({
      id: "quick-properties",
      group: "Quick Actions",
      title: "Open property hub",
      subtitle: "Shared property records across pipeline, acquisitions, and management",
      to: "/properties",
      icon: HomeModernIcon,
      keywords: ["property hub workspace records"],
      tone: "verdigris",
      priority: 195,
      pinned: true,
    }),
    createEntry({
      id: "quick-applications",
      group: "Quick Actions",
      title: "Review applications",
      subtitle: "Leasing pipeline, applicant queue, and screening steps",
      to: "/applications",
      icon: ClipboardDocumentListIcon,
      keywords: ["leasing applicants screening"],
      tone: "sand",
      priority: 190,
      pinned: true,
    }),
    createEntry({
      id: "quick-management",
      group: "Quick Actions",
      title: "Open management workspace",
      subtitle: "Occupancy, vacancies, units, and property operations",
      to: "/management",
      icon: BuildingOffice2Icon,
      keywords: ["operations occupancy vacancies rent roll"],
      tone: "clay",
      priority: 188,
      pinned: true,
    }),
    createEntry({
      id: "quick-leads",
      group: "Quick Actions",
      title: "Open leads pipeline",
      subtitle: "Inbound opportunities, diligence, and acquisition status",
      to: "/leads",
      icon: UserGroupIcon,
      keywords: ["pipeline acquisition leads"],
      priority: 185,
      pinned: true,
    }),
    createEntry({
      id: "quick-investments",
      group: "Quick Actions",
      title: "Open project management",
      subtitle: "Saved lead comps, execution budgets, vendors, and project spend",
      to: "/project-management",
      icon: BriefcaseIcon,
      keywords: ["projects execution budgets acquisitions deals"],
      priority: 182,
      pinned: true,
    }),
    createEntry({
      id: "quick-new-property",
      group: "Quick Actions",
      title: "Create new property",
      subtitle: "Start a property record and place it into the right workspace",
      to: "/properties/new",
      icon: BriefcaseIcon,
      keywords: ["new create add property lead investment management"],
      tone: "verdigris",
      priority: 180,
      pinned: true,
    }),
    createEntry({
      id: "quick-account",
      group: "Quick Actions",
      title: "Open account center",
      subtitle: "Profile, billing, display, and workspace preferences",
      to: "/account",
      icon: HomeIcon,
      keywords: ["settings billing profile display account"],
      priority: 175,
      pinned: true,
    }),
  ];

  if (user?.isPlatformManager) {
    actions.push(
      createEntry({
        id: "quick-platform",
        group: "Platform",
        title: "Open platform manager",
        subtitle: "Support users, overrides, and impersonation tools",
        to: "/platform-manager",
        icon: BuildingOffice2Icon,
        keywords: ["admin support users platform manager"],
        tone: "clay",
        priority: 170,
        pinned: true,
      })
    );
  }

  return actions;
};

const buildPropertyEntries = (properties) =>
  (properties || []).map((property) => {
    const workspaceBits = [
      property.workspaces?.pipeline ? `Pipeline: ${property.workspaces.pipeline.status}` : null,
      property.workspaces?.acquisitions
        ? `Acquisitions: ${property.workspaces.acquisitions.strategyLabel}`
        : null,
      property.workspaces?.management ? `Management: ${property.workspaces.management.status}` : null,
    ].filter(Boolean);

    return createEntry({
      id: `property-${property.propertyKey}`,
      group: "Properties",
      title: property.title || property.placement || property.propertyKey,
      subtitle: workspaceBits.join(" • ") || "Shared property workspace",
      to: `/properties/${encodeURIComponent(property.propertyKey)}`,
      icon: HomeModernIcon,
      tone: "verdigris",
      keywords: [
        property.propertyKey,
        property.placement,
        property.sharedProfile?.propertyType,
        property.sharedProfile?.bedrooms,
        property.sharedProfile?.bathrooms,
        property.sharedProfile?.squareFootage,
      ],
      priority: 140,
    });
  });

const buildLeadEntries = (leads) =>
  (leads || []).map((lead) =>
    createEntry({
      id: `lead-${lead._id}`,
      group: "Leads",
      title: lead.address || "Untitled lead",
      subtitle: [lead.status, lead.propertyType, lead.listingStatus].filter(Boolean).join(" • "),
      to: `/leads/${lead._id}`,
      icon: UserGroupIcon,
      tone: "sand",
      keywords: [
        lead.sellerName,
        lead.sellerEmail,
        lead.sellerPhone,
        lead.nextAction,
        lead.leadSource,
      ],
      priority: 130,
    })
  );

const buildInvestmentEntries = (investments) =>
  (investments || []).map((investment) => {
    const strategyLabel = getInvestmentStrategyLabel(
      normalizeInvestmentStrategy(investment.strategy || investment.type)
    );

    return createEntry({
      id: `investment-${investment._id}`,
      group: "Project Management",
      title: investment.address || "Untitled project",
      subtitle: [strategyLabel, investment.status, investment.progress ? `${investment.progress}% progress` : null]
        .filter(Boolean)
        .join(" • "),
      to: `/project-management/${investment._id}`,
      icon: BriefcaseIcon,
      tone: "clay",
      keywords: [investment.exitStrategy, investment.notes, investment.city, investment.state],
      priority: 125,
    });
  });

const buildManagedPropertyEntries = (managedProperties) =>
  (managedProperties || []).map((property) =>
    createEntry({
      id: `managed-${property._id}`,
      group: "Management",
      title: property.address || "Managed property",
      subtitle: [
        property.isActive ? "Active property" : "Archived property",
        `${property.units?.length || 0} unit${property.units?.length === 1 ? "" : "s"}`,
      ].join(" • "),
      to: `/management/${property._id}`,
      icon: BuildingOffice2Icon,
      tone: "clay",
      keywords: [property.address, property.city, property.state],
      priority: 145,
    })
  );

const buildLeaseEntries = (managedProperties) =>
  (managedProperties || []).flatMap((property) =>
    (property.units || [])
      .filter((unit) => unit.currentLease?._id)
      .map((unit) =>
        createEntry({
          id: `lease-${unit.currentLease._id}`,
          group: "Tenants & Leases",
          title: unit.currentLease?.tenant?.fullName || `${property.address} ${unit.name}`,
          subtitle: [
            property.address,
            unit.name,
            unit.currentLease?.tenant?.email || "Active lease",
          ]
            .filter(Boolean)
            .join(" • "),
          to: `/management/leases/${unit.currentLease._id}`,
          icon: KeyIcon,
          tone: "verdigris",
          keywords: [
            unit.currentLease?.tenant?.phone,
            unit.currentLease?.tenant?.email,
            unit.name,
            property.address,
          ],
          priority: 135,
        })
      )
  );

const buildApplicationEntries = (managedProperties, applicationGroups) =>
  applicationGroups.flatMap((result, index) => {
    if (result.status !== "fulfilled") {
      return [];
    }

    const property = managedProperties[index];
    return (result.value || []).map((application) =>
      createEntry({
        id: `application-${application._id}`,
        group: "Applications",
        title: application.applicantInfo?.fullName || "Unnamed applicant",
        subtitle: [
          application.property?.address || property?.address,
          application.unit?.name ? `Unit ${application.unit.name}` : null,
          application.status,
        ]
          .filter(Boolean)
          .join(" • "),
        to: `/applications/${application._id}`,
        icon: ClipboardDocumentListIcon,
        tone: "sand",
        keywords: [
          application.applicantInfo?.email,
          application.applicantInfo?.phone,
          application.status,
          property?.address,
        ],
        priority: 132,
      })
    );
  });

const dedupeEntries = (entries) => {
  const seen = new Set();

  return entries.filter((entry) => {
    if (seen.has(entry.id)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  });
};

const ResultRow = React.forwardRef(function ResultRow(
  { entry, active, onClick, onHover },
  ref
) {
  const Icon = entry.icon;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      className={`flex w-full items-start gap-3 rounded-[20px] px-4 py-3 text-left transition ${
        active
          ? "bg-ink-900 text-white shadow-soft"
          : "bg-white/60 text-ink-900 hover:bg-white"
      }`}
    >
      <div
        className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[16px] ${
          active ? "bg-white/10 text-white" : toneStyles[entry.tone] || toneStyles.ink
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{entry.title}</p>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
              active ? "bg-white/10 text-white/80" : "bg-sand-100 text-ink-500"
            }`}
          >
            {entry.group}
          </span>
        </div>
        {entry.subtitle ? (
          <p className={`mt-1 text-sm ${active ? "text-white/72" : "text-ink-500"}`}>
            {entry.subtitle}
          </p>
        ) : null}
      </div>

      <ArrowRightIcon className={`mt-1 h-4 w-4 flex-shrink-0 ${active ? "text-white/70" : "text-ink-300"}`} />
    </button>
  );
});

const CommandPalette = ({ isOpen, onClose, user }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const itemRefs = useRef([]);
  const hasLoadedRef = useRef(false);
  const lastLoadedRef = useRef(0);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchEntries, setSearchEntries] = useState(() => buildQuickActions(user));
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    hasLoadedRef.current = false;
    setSearchEntries(buildQuickActions(user));
  }, [user]);

  const fetchSearchData = useCallback(
    async ({ force = false } = {}) => {
      if (
        !force &&
        hasLoadedRef.current &&
        Date.now() - lastLoadedRef.current < 60 * 1000
      ) {
        return;
      }

      setIsLoading(true);
      setLoadError("");

      try {
        const [propertiesResult, leadsResult, investmentsResult, managedPropertiesResult] =
          await Promise.allSettled([
            getProperties(),
            getLeads(),
            getInvestments(),
            getManagedProperties(),
          ]);

        const managedProperties =
          managedPropertiesResult.status === "fulfilled"
            ? managedPropertiesResult.value || []
            : [];

        const applicationResults = managedProperties.length
          ? await Promise.allSettled(
              managedProperties.map((property) => getApplicationsForProperty(property._id))
            )
          : [];

        const nextEntries = dedupeEntries([
          ...buildQuickActions(user),
          ...(propertiesResult.status === "fulfilled"
            ? buildPropertyEntries(propertiesResult.value)
            : []),
          ...(managedPropertiesResult.status === "fulfilled"
            ? buildManagedPropertyEntries(managedProperties)
            : []),
          ...(managedPropertiesResult.status === "fulfilled"
            ? buildLeaseEntries(managedProperties)
            : []),
          ...(leadsResult.status === "fulfilled" ? buildLeadEntries(leadsResult.value) : []),
          ...(investmentsResult.status === "fulfilled"
            ? buildInvestmentEntries(investmentsResult.value)
            : []),
          ...buildApplicationEntries(managedProperties, applicationResults),
        ]);

        startTransition(() => {
          setSearchEntries(nextEntries);
          setLoadError("");
        });

        hasLoadedRef.current = true;
        lastLoadedRef.current = Date.now();
      } catch (error) {
        setLoadError(error.message || "Failed to load search data.");
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setActiveIndex(0);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    fetchSearchData();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [fetchSearchData, isOpen]);

  const results = useMemo(() => {
    const normalizedQuery = normalizeSearchText(deferredQuery);

    if (!normalizedQuery) {
      return dedupeEntries([
        ...searchEntries.filter((entry) => entry.pinned).slice(0, 7),
        ...searchEntries
          .filter((entry) =>
            ["Management", "Properties", "Applications", "Tenants & Leases"].includes(entry.group)
          )
          .slice(0, 6),
      ]).slice(0, 12);
    }

    return searchEntries
      .map((entry) => ({ entry, score: getMatchScore(entry, normalizedQuery) }))
      .filter(({ score }) => score >= 0)
      .sort((left, right) => right.score - left.score || left.entry.title.localeCompare(right.entry.title))
      .slice(0, 12)
      .map(({ entry }) => entry);
  }, [deferredQuery, searchEntries]);

  const groupedResults = useMemo(() => {
    const buckets = new Map();

    results.forEach((entry, index) => {
      if (!buckets.has(entry.group)) {
        buckets.set(entry.group, []);
      }

      buckets.get(entry.group).push({ ...entry, index });
    });

    return GROUP_ORDER.filter((group) => buckets.has(group)).map((group) => ({
      group,
      items: buckets.get(group),
    }));
  }, [results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [deferredQuery, isOpen]);

  useEffect(() => {
    const activeItem = itemRefs.current[activeIndex];
    activeItem?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (!results.length) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % results.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + results.length) % results.length);
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const activeItem = results[activeIndex];
        if (activeItem) {
          navigate(activeItem.to);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, isOpen, navigate, onClose, results]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-ink-900/35 px-4 py-6 backdrop-blur-sm sm:px-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="surface-panel-strong w-full max-w-3xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="border-b border-ink-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3 rounded-[18px] border border-ink-100 bg-white/82 px-4 py-3 shadow-soft">
            <MagnifyingGlassIcon className="h-5 w-5 flex-shrink-0 text-ink-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages, properties, leads, tenants, or applicants"
              className="w-full border-none bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
            />
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-sand-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500 transition hover:bg-sand-200"
            >
              Esc
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-400">
            <span>Try an address, tenant name, lead status, or applicant email.</span>
            <span className="rounded-full bg-sand-100 px-2.5 py-1 font-mono uppercase tracking-[0.16em] text-ink-500">
              Ctrl/⌘ K
            </span>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-3 py-3 sm:px-4">
          {isLoading ? (
            <div className="px-2 py-3 text-sm text-ink-500">Indexing your workspace...</div>
          ) : null}

          {loadError ? (
            <div className="rounded-[18px] border border-clay-200 bg-clay-50 px-4 py-3 text-sm text-clay-700">
              {loadError}
            </div>
          ) : null}

          {groupedResults.length > 0 ? (
            <div className="space-y-4">
              {groupedResults.map((section) => (
                <div key={section.group}>
                  <div className="px-2 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-400">
                      {section.group}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {section.items.map((entry) => (
                      <ResultRow
                        key={entry.id}
                        ref={(node) => {
                          itemRefs.current[entry.index] = node;
                        }}
                        entry={entry}
                        active={entry.index === activeIndex}
                        onHover={() => setActiveIndex(entry.index)}
                        onClick={() => {
                          navigate(entry.to);
                          onClose();
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-2 py-10 text-center">
              <p className="text-lg font-semibold text-ink-900">No matches yet</p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Try a property address, tenant name, applicant, or lead keyword.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-ink-100 px-4 py-3 text-xs text-ink-400 sm:px-5">
          Use <span className="font-semibold text-ink-600">arrow keys</span> to move and{" "}
          <span className="font-semibold text-ink-600">Enter</span> to open.
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommandPalette;
