import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { updateLead } from "../utils/api";

const renovationLevelOptions = [
  { value: "", label: "Select renovation level" },
  { value: "light-cosmetic", label: "Light cosmetic refresh" },
  { value: "moderate", label: "Moderate renovation" },
  { value: "heavy", label: "Heavy renovation" },
  { value: "full-gut", label: "Full gut rehab" },
];

const renovationScopeOptions = [
  {
    value: "full-gut-rehab",
    label: "Full gut rehab",
    description: "Whole-home reset with major systems and finishes.",
  },
  {
    value: "kitchen",
    label: "Kitchen",
    description: "Cabinets, countertops, appliances, and layout updates.",
  },
  {
    value: "bathrooms",
    label: "Bathrooms",
    description: "Bathroom remodels, tile, fixtures, and waterproofing.",
  },
  {
    value: "flooring",
    label: "Flooring",
    description: "Replace or refinish flooring throughout the property.",
  },
  {
    value: "paint-drywall",
    label: "Paint and drywall",
    description: "Interior wall repair, texture, priming, and paint.",
  },
  {
    value: "roof",
    label: "Roof",
    description: "Roof repair or full replacement scope.",
  },
  {
    value: "windows-doors",
    label: "Windows and doors",
    description: "Replace windows, exterior doors, or interior doors.",
  },
  {
    value: "hvac",
    label: "HVAC",
    description: "Heating, cooling, ducting, and ventilation updates.",
  },
  {
    value: "plumbing",
    label: "Plumbing",
    description: "Supply, drain, fixture, and water heater updates.",
  },
  {
    value: "electrical",
    label: "Electrical",
    description: "Panel, wiring, fixtures, and outlet updates.",
  },
  {
    value: "structural",
    label: "Structural",
    description: "Framing, beam work, support repairs, and structural corrections.",
  },
  {
    value: "exterior-landscape",
    label: "Exterior and landscape",
    description: "Siding, fascia, paint, curb appeal, and site work.",
  },
];

const renovationItemStatusOptions = [
  { value: "planning", label: "Planning" },
  { value: "ready-to-quote", label: "Ready to quote" },
  { value: "quoted", label: "Quoted" },
  { value: "awarded", label: "Awarded" },
];

const renovationCategoryOptions = [
  ...renovationScopeOptions.map((scope) => ({ value: scope.value, label: scope.label })),
  { value: "custom", label: "Custom" },
];

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.valueOf())) return "—";
  return date.toLocaleDateString();
};

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildRenovationItemId = () =>
  `ren-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const findRenovationScopeOption = (value) =>
  renovationScopeOptions.find((scope) => scope.value === value) || null;

const getUniqueRenovationItemName = (existingItems = [], baseName) => {
  const normalizedBaseName = String(baseName || "Custom item").trim() || "Custom item";
  const existingNames = new Set(
    existingItems.map((item) => String(item.name || "").trim().toLowerCase()).filter(Boolean)
  );

  if (!existingNames.has(normalizedBaseName.toLowerCase())) {
    return normalizedBaseName;
  }

  let suffix = 2;
  while (existingNames.has(`${normalizedBaseName} ${suffix}`.toLowerCase())) {
    suffix += 1;
  }

  return `${normalizedBaseName} ${suffix}`;
};

const createRenovationItem = (input = {}, existingItems = []) => {
  const template = findRenovationScopeOption(input.category || input.value || "");
  const providedName = typeof input.name === "string" ? input.name.trim() : "";
  const baseName = providedName || template?.label || "Custom item";

  return {
    itemId:
      typeof input.itemId === "string" && input.itemId.trim()
        ? input.itemId.trim()
        : buildRenovationItemId(),
    name: providedName || getUniqueRenovationItemName(existingItems, baseName),
    category: input.category || template?.value || "custom",
    budget: input.budget ?? "",
    status: input.status || "planning",
    scopeDescription:
      typeof input.scopeDescription === "string" && input.scopeDescription.trim()
        ? input.scopeDescription.trim()
        : template?.description || "",
  };
};

const normalizeRenovationItems = (items = []) => {
  const normalizedItems = [];

  items.forEach((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return;
    }

    const nextItem = createRenovationItem(
      {
        itemId: item.itemId,
        name: item.name,
        category: item.category,
        budget: item.budget ?? "",
        status: item.status,
        scopeDescription: item.scopeDescription,
      },
      normalizedItems
    );

    if (
      nextItem.name ||
      nextItem.scopeDescription ||
      nextItem.budget !== "" ||
      nextItem.category !== "custom"
    ) {
      normalizedItems.push(nextItem);
    }
  });

  return normalizedItems;
};

const buildLegacyRenovationItems = (plan = {}) => {
  const items = [];

  if (Array.isArray(plan.selectedScopes)) {
    plan.selectedScopes.forEach((scope) => {
      const normalizedScope = String(scope || "").trim();
      if (!normalizedScope) return;

      items.push(
        createRenovationItem(
          {
            category: normalizedScope,
          },
          items
        )
      );
    });
  }

  const legacyNotes = [plan.layoutChanges, plan.contractorNotes, plan.additionalNotes]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join("\n\n");

  if (!items.length && legacyNotes) {
    items.push(
      createRenovationItem(
        {
          name: "General renovation notes",
          category: "custom",
          scopeDescription: legacyNotes,
        },
        items
      )
    );
  }

  return items;
};

const buildRenovationItemDraft = (item = {}) => ({
  itemId: item.itemId || "",
  category: item.category || "custom",
  name: item.name || "",
  budget: item.budget ?? "",
  status: item.status || "planning",
  scopeDescription: item.scopeDescription || "",
});

export const buildRenovationForm = (lead = {}) => {
  const plan = lead?.renovationPlan || {};
  const items = normalizeRenovationItems(plan.items);

  return {
    verifiedSquareFootage: plan.verifiedSquareFootage ?? lead?.squareFootage ?? "",
    renovationLevel: plan.renovationLevel || "",
    extensionPlanned: Boolean(plan.extensionPlanned),
    extensionSquareFootage: plan.extensionSquareFootage ?? "",
    items: items.length ? items : buildLegacyRenovationItems(plan),
  };
};

const buildRenovationPayload = (form = {}) => ({
  verifiedSquareFootage: toOptionalNumber(form.verifiedSquareFootage),
  renovationLevel: form.renovationLevel || "",
  extensionPlanned: Boolean(form.extensionPlanned),
  extensionSquareFootage: form.extensionPlanned
    ? toNullableNumber(form.extensionSquareFootage)
    : null,
  items: Array.isArray(form.items)
    ? form.items
        .map((item, index) => {
          const name = String(item?.name || "").trim();
          const scopeDescription = String(item?.scopeDescription || "").trim();
          const budget = toNullableNumber(item?.budget);

          if (!name && !scopeDescription && budget === null) {
            return null;
          }

          return {
            itemId:
              typeof item?.itemId === "string" && item.itemId.trim()
                ? item.itemId.trim()
                : `${buildRenovationItemId()}-${index}`,
            name: name || "Custom item",
            category: item?.category || "custom",
            budget,
            status: item?.status || "planning",
            scopeDescription,
          };
        })
        .filter(Boolean)
    : [],
});

const SummaryStat = ({ label, value, hint }) => (
  <div className="metric-tile p-4">
    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-400">{label}</p>
    <p className="mt-3 text-lg font-medium text-ink-900">{value}</p>
    {hint ? <p className="mt-2 text-sm leading-6 text-ink-500">{hint}</p> : null}
  </div>
);

const FormField = ({ label, hint, children, className = "" }) => (
  <label className={`space-y-2 ${className}`.trim()}>
    <span className="text-sm font-medium text-ink-700">{label}</span>
    {children}
    {hint ? <span className="block text-xs leading-5 text-ink-400">{hint}</span> : null}
  </label>
);

const RenovationItemModal = ({
  isOpen,
  draft,
  isEditing,
  onChange,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div>
            <span className="eyebrow">{isEditing ? "Edit renovation item" : "Add renovation item"}</span>
            <h3 className="mt-3 text-2xl font-semibold text-ink-900">
              {isEditing ? "Update renovation item" : "Create renovation item"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Choose a preset item or custom scope, then set the budget and contractor-ready description.
            </p>
          </div>
          <button type="button" onClick={onClose} className="ghost-action">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
          <FormField label="Choose from list or custom">
            <select
              name="category"
              value={draft.category}
              onChange={onChange}
              className="auth-input appearance-none"
            >
              {renovationCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Budget">
            <input
              name="budget"
              type="number"
              value={draft.budget}
              onChange={onChange}
              className="auth-input"
              placeholder="0"
            />
          </FormField>

          <FormField label="Item name">
            <input
              name="name"
              value={draft.name}
              onChange={onChange}
              className="auth-input"
              placeholder="Kitchen remodel"
            />
          </FormField>

          <FormField label="Item status">
            <select
              name="status"
              value={draft.status}
              onChange={onChange}
              className="auth-input appearance-none"
            >
              {renovationItemStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Scope for contractor quote"
            hint="Describe exactly what this contractor should price, including any must-haves or finish level."
            className="md:col-span-2"
          >
            <textarea
              name="scopeDescription"
              rows="6"
              value={draft.scopeDescription}
              onChange={onChange}
              className="auth-input min-h-[180px]"
              placeholder="Example: demo existing kitchen, install shaker cabinets, quartz counters, undermount sink, new faucet, backsplash, and appliance hookups. Quote labor and material separately."
            />
          </FormField>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-ink-100 px-6 py-5">
          <button type="button" onClick={onClose} className="ghost-action">
            Cancel
          </button>
          <button type="button" onClick={onSave} className="primary-action">
            {isEditing ? "Save item" : "Add item"}
          </button>
        </div>
      </div>
    </div>
  );
};

const LeadRenovationTab = ({ lead = null, leadId = "", onLeadUpdated }) => {
  const [renovationForm, setRenovationForm] = useState(() => buildRenovationForm(lead || {}));
  const [isSavingRenovation, setIsSavingRenovation] = useState(false);
  const [lastRenovationSavedAt, setLastRenovationSavedAt] = useState("");
  const [isRenovationItemModalOpen, setIsRenovationItemModalOpen] = useState(false);
  const [editingRenovationItemId, setEditingRenovationItemId] = useState(null);
  const [renovationItemDraft, setRenovationItemDraft] = useState(() =>
    buildRenovationItemDraft()
  );

  useEffect(() => {
    setRenovationForm(buildRenovationForm(lead || {}));
    setLastRenovationSavedAt("");
  }, [lead]);

  const renovationBudgetTotal = useMemo(
    () => renovationForm.items.reduce((sum, item) => sum + (Number(item.budget) || 0), 0),
    [renovationForm.items]
  );

  const renovationBudgetedItemCount = useMemo(
    () =>
      renovationForm.items.filter(
        (item) => item.budget !== "" && item.budget !== null && item.budget !== undefined
      ).length,
    [renovationForm.items]
  );

  const renovationItemsCount = renovationForm.items.length;

  const handleRenovationChange = (event) => {
    const { name, value } = event.target;
    setRenovationForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const closeRenovationItemModal = () => {
    setIsRenovationItemModalOpen(false);
    setEditingRenovationItemId(null);
    setRenovationItemDraft(buildRenovationItemDraft());
  };

  const openAddRenovationItemModal = () => {
    setEditingRenovationItemId(null);
    setRenovationItemDraft(buildRenovationItemDraft());
    setIsRenovationItemModalOpen(true);
  };

  const openEditRenovationItemModal = (item) => {
    setEditingRenovationItemId(item.itemId);
    setRenovationItemDraft(buildRenovationItemDraft(item));
    setIsRenovationItemModalOpen(true);
  };

  const handleRenovationDraftChange = (event) => {
    const { name, value } = event.target;

    setRenovationItemDraft((previous) => {
      const next = {
        ...previous,
        [name]: value,
      };

      if (name === "category") {
        const previousTemplate = findRenovationScopeOption(previous.category);
        const nextTemplate = findRenovationScopeOption(value);

        if (!previous.name || previous.name === previousTemplate?.label) {
          next.name = nextTemplate?.label || "";
        }

        if (!previous.scopeDescription || previous.scopeDescription === previousTemplate?.description) {
          next.scopeDescription = nextTemplate?.description || "";
        }
      }

      return next;
    });
  };

  const handleSaveRenovationItemDraft = () => {
    const normalizedName =
      String(renovationItemDraft.name || "").trim() ||
      findRenovationScopeOption(renovationItemDraft.category)?.label ||
      "Custom item";

    setRenovationForm((previous) => {
      const existingItems = previous.items.filter((item) => item.itemId !== editingRenovationItemId);
      const nextItem = createRenovationItem(
        {
          ...renovationItemDraft,
          itemId: editingRenovationItemId || renovationItemDraft.itemId,
          name: normalizedName,
          budget: renovationItemDraft.budget,
          scopeDescription: renovationItemDraft.scopeDescription,
          status: renovationItemDraft.status,
        },
        existingItems
      );

      return {
        ...previous,
        items: editingRenovationItemId
          ? previous.items.map((item) => (item.itemId === editingRenovationItemId ? nextItem : item))
          : [...previous.items, nextItem],
      };
    });

    closeRenovationItemModal();
  };

  const handleDeleteRenovationItem = (itemId) => {
    if (!window.confirm("Delete this renovation item?")) {
      return;
    }

    setRenovationForm((previous) => ({
      ...previous,
      items: previous.items.filter((item) => item.itemId !== itemId),
    }));

    if (editingRenovationItemId === itemId) {
      closeRenovationItemModal();
    }
  };

  const handleSaveRenovation = async () => {
    if (!leadId) {
      toast.error("This property does not have a linked lead yet.");
      return;
    }

    setIsSavingRenovation(true);

    try {
      const updatedLead = await updateLead(leadId, {
        renovationPlan: buildRenovationPayload(renovationForm),
      });

      setRenovationForm(buildRenovationForm(updatedLead));
      setLastRenovationSavedAt(new Date().toISOString());
      if (typeof onLeadUpdated === "function") {
        onLeadUpdated(updatedLead);
      }
      toast.success("Renovation plan saved.");
    } catch (error) {
      toast.error(error.message || "Failed to save renovation plan.");
    } finally {
      setIsSavingRenovation(false);
    }
  };

  if (!lead || !leadId) {
    return (
      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Renovation plan</span>
        <h3 className="mt-4 text-3xl font-semibold text-ink-900">Add this property to leads first</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">
          The renovation planner stays tied to the lead workspace so budgets, bids, and saved reports
          all follow the same property record.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="section-card p-6 sm:p-7">
        <span className="eyebrow">Renovation planning and estimate</span>
        <h2 className="mt-4 text-2xl font-semibold text-ink-900">
          Build the scope before you price the job
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          Set the project basics first, then build a clear renovation item list with budgets and
          contractor-ready scopes.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <FormField
            label="Verified square footage"
            hint="Confirm the usable square footage before building the estimate."
          >
            <input
              name="verifiedSquareFootage"
              type="number"
              value={renovationForm.verifiedSquareFootage}
              onChange={handleRenovationChange}
              className="auth-input"
              placeholder="0"
            />
          </FormField>

          <FormField label="Renovation level">
            <select
              name="renovationLevel"
              value={renovationForm.renovationLevel}
              onChange={handleRenovationChange}
              className="auth-input appearance-none"
            >
              {renovationLevelOptions.map((option) => (
                <option key={option.value || "empty"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Will there be an extension?">
            <select
              name="extensionPlanned"
              value={renovationForm.extensionPlanned ? "yes" : "no"}
              onChange={(event) =>
                setRenovationForm((previous) => ({
                  ...previous,
                  extensionPlanned: event.target.value === "yes",
                  extensionSquareFootage:
                    event.target.value === "yes" ? previous.extensionSquareFootage : "",
                }))
              }
              className="auth-input appearance-none"
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </FormField>

          <FormField label="Extension square footage">
            <input
              name="extensionSquareFootage"
              type="number"
              value={renovationForm.extensionSquareFootage}
              onChange={handleRenovationChange}
              className="auth-input"
              placeholder={renovationForm.extensionPlanned ? "0" : "Not needed"}
              disabled={!renovationForm.extensionPlanned}
            />
          </FormField>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryStat
          label="Total Renovation Budget"
          value={renovationBudgetedItemCount ? formatCurrency(renovationBudgetTotal) : "—"}
          hint={
            renovationBudgetedItemCount
              ? `${renovationBudgetedItemCount} of ${renovationItemsCount} items budgeted`
              : "Add budgets to your renovation items"
          }
        />
        <SummaryStat
          label="Renovation Items"
          value={renovationItemsCount}
          hint={renovationItemsCount ? "Items currently in the plan" : "No items added yet"}
        />
        <SummaryStat
          label="Extension"
          value={
            renovationForm.extensionPlanned
              ? renovationForm.extensionSquareFootage
                ? `${Number(renovationForm.extensionSquareFootage).toLocaleString()} sqft`
                : "Yes"
              : "No"
          }
          hint={
            renovationForm.verifiedSquareFootage
              ? `Verified size ${Number(renovationForm.verifiedSquareFootage).toLocaleString()} sqft`
              : "Square footage not verified yet"
          }
        />
      </div>

      <section className="section-card p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="eyebrow">Renovation plan list</span>
            <h3 className="mt-3 text-2xl font-semibold text-ink-900">Build the scope list</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Add renovation items one by one, set the budget, and write what the contractor should quote.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddRenovationItemModal}
            className="primary-action inline-flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Add renovation item
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {renovationItemsCount ? (
            renovationForm.items.map((item) => {
              const categoryLabel =
                renovationCategoryOptions.find((option) => option.value === item.category)?.label ||
                "Custom";
              const statusLabel =
                renovationItemStatusOptions.find((option) => option.value === item.status)?.label ||
                "Planning";

              return (
                <div
                  key={item.itemId}
                  className="rounded-[24px] border border-ink-100 bg-white px-5 py-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-ink-900">
                          {item.name || "Untitled item"}
                        </h4>
                        <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                          {categoryLabel}
                        </span>
                        <span className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-600">
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-500">
                        {item.scopeDescription || "No scope description added yet."}
                      </p>
                    </div>

                    <div className="rounded-[18px] bg-sand-50 px-4 py-4 text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                        Budget
                      </p>
                      <p className="mt-2 text-lg font-semibold text-ink-900">
                        {item.budget !== "" && item.budget !== null && item.budget !== undefined
                          ? formatCurrency(item.budget)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => openEditRenovationItemModal(item)}
                      className="ghost-action inline-flex items-center gap-2"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit item
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRenovationItem(item.itemId)}
                      className="ghost-action inline-flex items-center gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete item
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-ink-200 bg-sand-50/70 px-5 py-10 text-center">
              <h4 className="text-xl font-semibold text-ink-900">No renovation items yet</h4>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Click <span className="font-semibold text-ink-900">Add renovation item</span> to
                choose from the preset list or create a custom one.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          {lastRenovationSavedAt
            ? `Saved ${formatDate(lastRenovationSavedAt)}. Your renovation items and budgets are stored on this lead.`
            : "Save renovation plan to store the item list, budgets, and project setup on this lead."}
        </p>
        <button
          type="button"
          onClick={handleSaveRenovation}
          disabled={isSavingRenovation}
          className="primary-action disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSavingRenovation ? "Saving..." : "Save renovation plan"}
        </button>
      </div>

      <RenovationItemModal
        isOpen={isRenovationItemModalOpen}
        draft={renovationItemDraft}
        isEditing={Boolean(editingRenovationItemId)}
        onChange={handleRenovationDraftChange}
        onClose={closeRenovationItemModal}
        onSave={handleSaveRenovationItemDraft}
      />
    </div>
  );
};

export default LeadRenovationTab;
