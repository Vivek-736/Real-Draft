"use client";
import React, { useEffect, useRef, useState } from "react";
import { RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import Header from "./Header";
import { UserButton } from "@clerk/nextjs";
import { Editor } from "./editor/Editor";
import Loader from "./Loader";
import ActiveCollaborators from "./ActiveCollaborators";
import { Input } from "./ui/input";
import { EditIcon } from "lucide-react";
import { updateDocument } from "@/lib/actions/room.actions";
import ShareModal from "./ShareModal";

const CollaborativeRoom = ({
  roomId,
  roomMetadata,
  users,
  currentUserType
}: CollaborativeRoomProps) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentTitle, setDocumentTitle] = useState(roomMetadata.title);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateTitlehandler = async (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      setLoading(true);

      try {
        if (documentTitle !== roomMetadata.title) {
          const updatedDocument = await updateDocument(roomId, documentTitle);

          if (updatedDocument) {
            setEditing(false);
          }
        }
      } catch (error) {
        console.log(error);
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setEditing(false);
        updateDocument(roomId, documentTitle);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [roomId, documentTitle]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  return (
    <RoomProvider id={roomId}>
      <ClientSideSuspense fallback={<Loader />}>
        <div className="flex size-full max-h-screen flex-1 flex-col items-center overflow-hidden">
          <Header>
            <div
              ref={containerRef}
              className="flex w-fit justify-center items-center gap-2"
            >
              {editing && !loading ? (
                <Input
                  type="text"
                  ref={inputRef}
                  value={documentTitle}
                  placeholder="Enter title"
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  onKeyDown={updateTitlehandler}
                  disabled={!editing}
                  className="min-w-[78px] flex-1 border-none bg-transparent px-0 text-left text-base font-semibold leading-[24px] focus-visible:ring-0 focus-visible:ring-offset-0 disabled:text-black sm:text-xl md:text-center"
                />
              ) : (
                <>
                  <p className="line-clamp-1 border-dark-400 text-base font-semibold leading-[24px] sm:pl-0 sm:text-xl">
                    {documentTitle}
                  </p>
                </>
              )}
              {currentUserType === "editor" && !editing && (
                <EditIcon
                  className="h-5 w-5 cursor-pointer"
                  onClick={() => setEditing(true)}
                />
              )}
              {loading && <p className="text-sm text-gray-400">saving...</p>}
            </div>
            <div className="flex w-full justify-end flex-1 gap-2 sm:gap-3">
              <ActiveCollaborators />

              <ShareModal
                roomId={roomId}
                collaborators={users}
                creatorId={roomMetadata.creatorId}
                currentUserType={currentUserType}
              />

              <UserButton />
            </div>
          </Header>
          <Editor roomId={roomId} currentUserType={currentUserType} />
        </div>
      </ClientSideSuspense>
    </RoomProvider>
  );
};

export default CollaborativeRoom;
