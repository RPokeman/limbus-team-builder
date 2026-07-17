// apps/web/src/screens/preview/TeamCopyPaste.tsx
import React, { useState } from "react";
import TeamCodeModal from "../../components/modals/TeamCodeModal";

export default function TeamCopyPaste(props: {
  teamCode: string;
  setTeamCode: (code: string) => void;
  teamCodeError: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Copy / Load Team Code"
        style={{
          width: 44,
          height: 40,
          borderRadius: 8,
          border: "1px solid #2b2b31",
          background: "#15151a",
          color: "#eee",
          cursor: "pointer",
          fontWeight: 900,
        }}
      >
        📋
      </button>

      {open && (
        <TeamCodeModal
          teamCode={props.teamCode}
          setTeamCode={props.setTeamCode}
          error={props.teamCodeError}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
