import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import {
  createLead,
  getLeadSummary,
  getLeads,
  previewLeadProperty,
  searchAddressSuggestions,
  updateLead,
} from '../utils/api';

const initialLeadForm = {
  address: '',
  latitude: '',
  longitude: '',
  propertyType: '',
  bedrooms: '',
  bathrooms: '',
  squareFootage: '',
  yearBuilt: '',
  sellerAskingPrice: '',
  notes: '',
  listingStatus: '',
  daysOnMarket: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  county: '',
  lastSalePrice: '',
  lastSaleDate: '',
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

const mapPreviewToForm = (preview) => ({
  address: preview.address || '',
  latitude: preview.latitude ?? '',
  longitude: preview.longitude ?? '',
  propertyType: preview.propertyType || '',
  bedrooms: preview.bedrooms ?? '',
  bathrooms: preview.bathrooms ?? '',
  squareFootage: preview.squareFootage ?? '',
  yearBuilt: preview.yearBuilt ?? '',
  sellerAskingPrice: preview.sellerAskingPrice ?? '',
  listingStatus: preview.listingStatus || '',
  daysOnMarket: preview.daysOnMarket ?? '',
  addressLine1: preview.addressLine1 || '',
  addressLine2: preview.addressLine2 || '',
  city: preview.city || '',
  state: preview.state || '',
  zipCode: preview.zipCode || '',
  county: preview.county || '',
  lastSalePrice: preview.lastSalePrice ?? '',
  lastSaleDate: preview.lastSaleDate ? preview.lastSaleDate.slice(0, 10) : '',
});

const AddLeadModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(initialLeadForm);
  const [suggestions, setSuggestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewMetadata, setPreviewMetadata] = useState(null);
  const selectedSuggestionRef = useRef('');

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialLeadForm);
      setSuggestions([]);
      setPreviewMetadata(null);
      selectedSuggestionRef.current = '';
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const query = formData.address.trim();
    if (query.length < 4 || query === selectedSuggestionRef.current) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const results = await searchAddressSuggestions(query, controller.signal);
        setSuggestions(results);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Address suggestion error', error);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [formData.address, isOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'address') {
      selectedSuggestionRef.current = '';
      setPreviewMetadata(null);
    }
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handlePreviewLookup = async (addressOverride) => {
    const address = addressOverride || formData.address.trim();
    if (!address) {
      toast.error('Select or type an address first.');
      return;
    }

    setIsPreviewLoading(true);
    try {
      const preview = await previewLeadProperty({
        ...formData,
        address,
      });
      setFormData((previous) => ({
        ...previous,
        ...mapPreviewToForm(preview),
      }));
      setPreviewMetadata(preview.metadata || null);
    } catch (error) {
      toast.error(error.message || 'Failed to load property details.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    selectedSuggestionRef.current = suggestion.place_name;
    setSuggestions([]);
    setFormData((previous) => ({
      ...previous,
      address: suggestion.place_name,
      longitude: suggestion.center?.[0] ?? previous.longitude,
      latitude: suggestion.center?.[1] ?? previous.latitude,
    }));
    await handlePreviewLookup(suggestion.place_name);
  };

  const handleSubmit = async () => {
    if (!formData.address.trim()) {
      toast.error('Address is required.');
      return;
    }

    setIsSaving(true);
    try {
      await createLead(formData);
      toast.success('Lead added to your pipeline.');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to create lead.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="border-b px-6 py-5">
          <h3 className="text-2xl font-bold text-gray-900">Add New Lead</h3>
          <p className="mt-1 text-sm text-gray-500">
            Search an address, auto-fill property details, then save the lead.
          </p>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-gray-700">Property address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Start typing an address..."
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full border-b border-gray-100 px-4 py-3 text-left text-sm hover:bg-gray-50"
                    >
                      {suggestion.place_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handlePreviewLookup()}
                disabled={isPreviewLoading || !formData.address.trim()}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
              >
                {isPreviewLoading ? 'Loading property details...' : 'Auto-fill property details'}
              </button>
              {previewMetadata && (
                <p className="text-sm text-gray-500">
                  {previewMetadata.propertyFound ? 'Property record found.' : 'No property record found.'}{' '}
                  {previewMetadata.activeListingFound ? 'Active listing found.' : 'No active listing found.'}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Property type</label>
                <input
                  type="text"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Beds</label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Baths</label>
                <input
                  type="number"
                  step="0.5"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Square feet</label>
                <input
                  type="number"
                  name="squareFootage"
                  value={formData.squareFootage}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Year built</label>
                <input
                  type="number"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Seller asking price</label>
                <input
                  type="number"
                  name="sellerAskingPrice"
                  value={formData.sellerAskingPrice}
                  onChange={handleChange}
                  placeholder="Auto-filled if listing found"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                rows="4"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Motivation, seller situation, target exit, or anything important..."
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl bg-gray-50 p-5">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Lead Snapshot</h4>
              <p className="mt-1 text-sm text-gray-500">
                These fields are saved with the lead so your comps report has context.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ask Price</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {formatCurrency(formData.sellerAskingPrice)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Property Facts</p>
                <p className="mt-2 text-sm text-gray-700">
                  {[formData.propertyType, formData.squareFootage ? `${formData.squareFootage} sqft` : null]
                    .filter(Boolean)
                    .join(' • ') || 'No property details yet'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {[formData.bedrooms ? `${formData.bedrooms} bd` : null, formData.bathrooms ? `${formData.bathrooms} ba` : null, formData.yearBuilt ? `Built ${formData.yearBuilt}` : null]
                    .filter(Boolean)
                    .join(' • ')}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Listing Status</p>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {formData.listingStatus || 'Not available'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {formData.daysOnMarket ? `${formData.daysOnMarket} days on market` : 'Days on market unavailable'}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last Sale</p>
                <p className="mt-2 text-sm font-medium text-gray-900">{formatCurrency(formData.lastSalePrice)}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {formData.lastSaleDate || 'No recent sale found'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-md border px-4 py-2 font-medium text-gray-700">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="rounded-md bg-brand-turquoise px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? 'Saving lead...' : 'Add lead'}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
  </div>
);

const LeadCard = ({ lead, onClick, dragHandleProps, innerRef, draggableProps }) => (
  <div
    ref={innerRef}
    {...draggableProps}
    {...dragHandleProps}
    className="cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-lg"
    onClick={onClick}
  >
    <p className="text-sm font-semibold text-gray-900">{lead.address}</p>
    <p className="mt-2 text-sm text-gray-500">
      {[lead.propertyType, lead.squareFootage ? `${lead.squareFootage} sqft` : null].filter(Boolean).join(' • ') || 'Property details pending'}
    </p>
    <p className="mt-1 text-sm text-gray-500">
      {[lead.bedrooms ? `${lead.bedrooms} bd` : null, lead.bathrooms ? `${lead.bathrooms} ba` : null].filter(Boolean).join(' • ')}
    </p>
    <div className="mt-4 flex items-center justify-between text-xs">
      <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-600">
        {lead.listingStatus || 'Lead'}
      </span>
      <span className="font-semibold text-brand-turquoise">
        {lead.sellerAskingPrice ? formatCurrency(lead.sellerAskingPrice) : 'Ask TBD'}
      </span>
    </div>
  </div>
);

const LeadsPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columns, setColumns] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const columnOrder = ['Potential', 'Analyzing', 'Offer Made', 'Under Contract', 'Closed - Won', 'Closed - Lost'];

  const fetchData = async () => {
    try {
      const [leadsData, summaryData] = await Promise.all([getLeads(), getLeadSummary()]);

      setSummary(summaryData);

      const initialColumns = columnOrder.reduce((accumulator, column) => {
        accumulator[column] = { id: column, title: column, leads: [] };
        return accumulator;
      }, {});

      leadsData.forEach((lead) => {
        if (initialColumns[lead.status]) {
          initialColumns[lead.status].leads.push(lead);
        }
      });

      setColumns(initialColumns);
    } catch (error) {
      console.error('Failed to fetch leads data', error);
      toast.error('Failed to load the leads dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOnDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceColumn = columns[source.droppableId];
    const destColumn = columns[destination.droppableId];
    const sourceLeads = [...sourceColumn.leads];
    const [movedLead] = sourceLeads.splice(source.index, 1);

    const newColumns = { ...columns };
    newColumns[source.droppableId] = { ...sourceColumn, leads: sourceLeads };

    if (source.droppableId === destination.droppableId) {
      newColumns[source.droppableId].leads.splice(destination.index, 0, movedLead);
    } else {
      const destLeads = [...destColumn.leads];
      destLeads.splice(destination.index, 0, movedLead);
      newColumns[destination.droppableId] = { ...destColumn, leads: destLeads };
    }

    setColumns(newColumns);

    try {
      await updateLead(draggableId, { status: destination.droppableId });
      const summaryData = await getLeadSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to update lead status', error);
      toast.error('Failed to update lead status.');
      fetchData();
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <AddLeadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} />
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Leads Dashboard</h1>
            <p className="mt-1 text-lg text-gray-500">Build a smarter acquisition pipeline with richer lead data.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full rounded-md bg-brand-turquoise px-4 py-2 font-semibold text-white sm:w-auto"
          >
            + Add New Lead
          </button>
        </div>

        {summary && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard title="Total Active Leads" value={summary.totalLeads} />
            <StatCard title="Analyzing" value={summary.analyzingCount} />
            <StatCard title="Under Contract" value={summary.underContractCount} />
            <StatCard title="Closing Ratio" value={`${summary.closingRatio.toFixed(1)}%`} />
          </div>
        )}

        <DragDropContext onDragEnd={handleOnDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columnOrder.map((columnId) => {
              const column = columns[columnId];
              return (
                <Droppable key={column.id} droppableId={column.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="w-80 flex-shrink-0 rounded-lg bg-gray-200 p-3"
                    >
                      <h3 className="mb-3 px-1 font-semibold text-gray-700">
                        {column.title} ({column.leads.length})
                      </h3>
                      <div className="min-h-[100px] space-y-3">
                        {column.leads.map((lead, index) => (
                          <Draggable key={lead._id} draggableId={lead._id} index={index}>
                            {(dragProvided) => (
                              <LeadCard
                                lead={lead}
                                innerRef={dragProvided.innerRef}
                                draggableProps={dragProvided.draggableProps}
                                dragHandleProps={dragProvided.dragHandleProps}
                                onClick={() => navigate(`/leads/${lead._id}`)}
                              />
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </>
  );
};

export default LeadsPage;
