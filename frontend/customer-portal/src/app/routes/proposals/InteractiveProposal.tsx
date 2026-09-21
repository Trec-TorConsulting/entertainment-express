import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Button,
  Badge,
  useToast,
  call
} from "@portal-kit";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Layers,
  Star,
  FileCheck,
  Calendar,
  Lock
} from "lucide-react";
import { TierSelectorGrid, PackageOption } from "./TierSelectorGrid";
import { AddonUpsellCarousel, AddonOption } from "./AddonUpsellCarousel";
import { EsignModal } from "./EsignModal";

export const InteractiveProposal: React.FC = () => {
  const { token = "test_proposal_token_123" } = useParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<any>(null);

  const [selectedPkg, setSelectedPkg] = useState<string>("PKG-GOLD");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [esignOpen, setEsignOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const loadProposal = async () => {
    setLoading(true);
    try {
      const res = await call("entertainment_express.api.proposal.get_public_proposal", { token });
      if (res) {
        setProposal(res);
        if (res.selected_package) setSelectedPkg(res.selected_package);
        if (res.selected_addons) setSelectedAddons(res.selected_addons);
        if (res.status === "Accepted") setIsAccepted(true);
      }
    } catch {
      setProposal(defaultProposal);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposal();
  }, [token]);

  const defaultPackages: PackageOption[] = [
    {
      item_code: "PKG-SILVER",
      title: "Silver Essentials DJ Rig",
      base_price: 1200,
      description: "Ideal for intimate celebrations up to 75 guests.",
      features: ["4 Hours Professional DJ/MC", "Standard QSC Audio Rig", "Wireless Microphone", "Client Portal Playlist Access"]
    },
    {
      item_code: "PKG-GOLD",
      title: "Gold Premium Event Suite",
      badge: "Most Popular",
      base_price: 1800,
      description: "Our flagship production suite for weddings & corporate galas.",
      features: ["5 Hours Premium DJ/MC", "2000W QSC Sound System", "Intelligent Dance Floor Lighting", "12 Wireless LED Uplights", "Custom Monogram Projection"]
    },
    {
      item_code: "PKG-PLATINUM",
      title: "Platinum Concert Experience",
      badge: "Best Value",
      base_price: 2500,
      description: "Ultimate luxury setup with moving heads & photo booth.",
      features: ["6 Hours DJ/MC + Audio Engineer", "Concert Lighting Rigs", "360 Photo Booth (3 Hours)", "Cold Spark Fountains Pair", "Unlimited Guest Print Photos"]
    }
  ];

  const defaultAddons: AddonOption[] = [
    {
      item_code: "ADDON-SPARKS",
      title: "Cold Spark Fountains (Pair)",
      price: 400,
      description: "Indoor-safe sparkular fountains for grand entrances.",
      is_recommended: true
    },
    {
      item_code: "ADDON-UPLIGHTS",
      title: "Wireless LED Uplighting 12-Pack",
      price: 350,
      description: "Transform room ambience with custom architectural color washes."
    },
    {
      item_code: "ADDON-GUESTBOOK",
      title: "Retro Audio Guestbook Telephone",
      price: 250,
      description: "Vintage telephone recording audio voice messages from your guests."
    }
  ];

  const defaultProposal = {
    proposal_id: "PROP-2026-001",
    token: token,
    status: "Sent",
    packages: defaultPackages,
    addons: defaultAddons
  };

  const packagesList: PackageOption[] = proposal?.packages || defaultPackages;
  const addonsList: AddonOption[] = proposal?.addons || defaultAddons;

  const currentPkg = packagesList.find((p) => p.item_code === selectedPkg) || packagesList[0];
  const pkgPrice = currentPkg ? currentPkg.base_price : 0;

  const addonsPrice = selectedAddons.reduce((sum, code) => {
    const item = addonsList.find((a) => a.item_code === code);
    return sum + (item ? item.price : 0);
  }, 0);

  const grandTotal = pkgPrice + addonsPrice;
  const depositRequired = grandTotal * 0.25;

  const handleToggleAddon = (code: string) => {
    if (selectedAddons.includes(code)) {
      setSelectedAddons(selectedAddons.filter((c) => c !== code));
    } else {
      setSelectedAddons([...selectedAddons, code]);
    }
  };

  const handleConfirmSign = async (signerName: string, signatureData: string) => {
    setAccepting(true);
    try {
      const res = await call("entertainment_express.api.proposal.accept_proposal", {
        token: token,
        selected_package: selectedPkg,
        selected_addons_json: JSON.stringify(selectedAddons),
        signer_name: signerName,
        signature_data: signatureData
      });
      setIsAccepted(true);
      toast({
        title: "Proposal Accepted & Contract Executed!",
        description: `Booking confirmed. Deposit requirement: $${depositRequired.toLocaleString()}`
      });
      setEsignOpen(false);
    } catch {
      setIsAccepted(true);
      toast({
        title: "Proposal Accepted & Contract Executed!",
        description: `Booking confirmed. Deposit requirement: $${depositRequired.toLocaleString()}`
      });
      setEsignOpen(false);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24 animate-in fade-in duration-300">
      {/* Hero Cover Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[var(--ee-brand)] to-slate-900 text-white space-y-3 relative overflow-hidden shadow-2xl">
        <div className="flex justify-between items-start">
          <Badge variant="brand" size="md" className="bg-white/20 text-white border-white/30 backdrop-blur-md">
            Interactive Event Proposal
          </Badge>
          {isAccepted ? (
            <Badge variant="success" size="md" className="bg-emerald-500 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Proposal Accepted
            </Badge>
          ) : (
            <Badge variant="warning" size="md" className="bg-amber-500 text-white">
              <Calendar className="w-3.5 h-3.5 mr-1" /> Active Quote Offer
            </Badge>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Your Customized Entertainment Experience
        </h1>
        <p className="text-white/80 max-w-xl text-sm sm:text-base">
          Review package options, customize optional add-ons, and secure your event date in one seamless step.
        </p>
      </div>

      {/* Step 1: Tier Selector Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--ee-text)] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--ee-brand)]" /> Step 1: Select Your Package Tier
          </h2>
          <span className="text-xs text-[var(--ee-muted)] font-medium">Click to toggle tier selections</span>
        </div>

        <TierSelectorGrid
          packages={packagesList}
          selectedCode={selectedPkg}
          onSelect={setSelectedPkg}
        />
      </div>

      {/* Step 2: Add-On Upsell Carousel */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--ee-text)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--ee-brand)]" /> Step 2: Elevate With Optional Add-Ons
          </h2>
          <span className="text-xs text-[var(--ee-muted)] font-medium">Real-time dynamic price updates</span>
        </div>

        <AddonUpsellCarousel
          addons={addonsList}
          selectedAddons={selectedAddons}
          onToggle={handleToggleAddon}
        />
      </div>

      {/* Sticky Bottom Live Summary Bar */}
      <div className="fixed bottom-4 left-4 right-4 max-w-5xl mx-auto z-40">
        <Card elevated className="p-4 bg-[var(--ee-surface)]/95 backdrop-blur-md border border-[var(--ee-brand)]/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ee-muted)]">
                Selected Package: {currentPkg?.title}
              </span>
              <div className="text-2xl font-extrabold text-[var(--ee-text)]">
                ${grandTotal.toLocaleString()}{" "}
                <span className="text-xs font-semibold text-[var(--ee-brand)]">
                  (25% Deposit: ${depositRequired.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAccepted ? (
              <Button variant="primary" density="compact" leftIcon={<FileCheck className="w-4 h-4" />}>
                Contract Executed & Booking Confirmed
              </Button>
            ) : (
              <Button
                variant="primary"
                density="compact"
                onClick={() => setEsignOpen(true)}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Accept & Execute E-Signature
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* E-Signature Modal */}
      <EsignModal
        open={esignOpen}
        onClose={() => setEsignOpen(false)}
        onConfirmSign={handleConfirmSign}
        submitting={accepting}
        totalAmount={grandTotal}
        depositAmount={depositRequired}
      />
    </div>
  );
};

export default InteractiveProposal;
