import { StudentPassRequestPage } from "./MainGate";

export default function LateralGatepass() {
  return (
    <StudentPassRequestPage
      mode="gatepass"
      category="lateral"
      titleOverride="Lateral Gatepass"
      subtitleOverride="Lateral students can submit gatepass requests and track faculty approvals."
    />
  );
}
