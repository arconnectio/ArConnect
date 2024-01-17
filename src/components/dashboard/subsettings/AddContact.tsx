import {
  Wrapper,
  Header,
  Footer,
  CenterText,
  PicWrapper,
  UploadIcon,
  RemoveContact,
  AutoContactPic,
  ContactPic,
  InputWrapper,
  SelectInput,
  ContactInput,
  ContactNotes,
  SubTitle,
  Title
} from "./ContactSettings";
import {
  Button,
  Modal,
  Spacer,
  useModal,
  useToasts
} from "@arconnect/components";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { uploadUserAvatar, getUserAvatar } from "~lib/avatar";
import styled from "styled-components";
import { useLocation } from "wouter";
import copy from "copy-to-clipboard";

export default function AddContact() {
  // contacts
  const [storedContacts, setStoredContacts] = useStorage(
    {
      key: "contacts",
      instance: ExtensionStorage
    },
    []
  );

  const { setToast } = useToasts();

  const [contact, setContact] = useState({
    name: "",
    address: "",
    profileIcon: "",
    notes: "",
    ArNSAddress: "",
    avatarId: ""
  });
  const [arnsResults, setArnsResults] = useState([]);

  const generateProfileIcon = (name) => {
    if (name && name.length > 0) {
      return name[0].toUpperCase();
    }
    return "";
  };

  const handleAvatarUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      try {
        const avatarTxId = await uploadUserAvatar(selectedFile);
        setToast({
          type: "success",
          content:
            "Uploaded avatar to Arweave. Your contact's avatar will be updated shortly.",
          duration: 5000,
          action: {
            name: browser.i18n.getMessage("copyId"),
            task: () => copy(avatarTxId)
          }
        });
        setContact({
          ...contact,
          avatarId: avatarTxId
        });
      } catch (error) {
        console.error("Error uploading avatar:", error);
      }
    }
  };

  useEffect(() => {
    if (contact.avatarId) {
      getUserAvatar(contact.avatarId)
        .then((imageUrl) => {
          console.log("fetched avatar:", imageUrl);
          setContact({
            ...contact,
            profileIcon: imageUrl
          });
        })
        .catch((error) => {
          console.error("Error fetching avatar:", error);
        });
    }
  }, [contact.avatarId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContact({
      ...contact,
      [name]: value
    });
  };

  async function getANTsContractTxIds(owner) {
    const response = await fetch(
      `https://api.arns.app/v1/wallet/${owner}/contracts?type=ant`
    );
    const data = await response.json();
    return data.contractTxIds;
  }

  async function getAllArNSNames(owner) {
    const contractTxIds = await getANTsContractTxIds(owner);
    if (contractTxIds.length === 0) return [];

    const url = [
      "https://api.arns.app/v1/contract/bLAgYxAdX2Ry-nt6aH2ixgvJXbpsEYm28NgJgyqfs-U/records?",
      ...contractTxIds.map((txId) => `contractTxId=${txId}`)
    ].join("&");

    const response = await fetch(url);
    const data = await response.json();
    return data;
  }

  async function fetchArnsAddresses(ownerAddress) {
    const arnsNames = await getAllArNSNames(ownerAddress);
    setArnsResults(arnsNames.records || []);
  }

  useEffect(() => {
    fetchArnsAddresses(contact.address);
  }, [contact.address]);

  const [, setLocation] = useLocation();

  const saveNewContact = async () => {
    const newContact = {
      name: contact.name,
      address: contact.address,
      profileIcon: contact.profileIcon,
      notes: contact.notes,
      ArNSAddress: contact.ArNSAddress,
      avatarId: contact.avatarId
    };

    try {
      // add new contact to contacts array
      const updatedContacts = [newContact, ...storedContacts];
      await ExtensionStorage.set("contacts", updatedContacts);
      setContact({
        name: "",
        address: "",
        profileIcon: "",
        notes: "",
        ArNSAddress: "",
        avatarId: ""
      });

      setLocation(`/contacts/${contact.address}`);
    } catch (error) {
      console.error("Error updating contacts:", error);
    }
  };

  const removeContactModal = useModal();

  // update this to just re-route to contacts and leave this new contact behind
  const confirmRemoveContact = async () => {
    setContact({
      name: "",
      address: "",
      profileIcon: "",
      notes: "",
      ArNSAddress: "",
      avatarId: ""
    });

    removeContactModal.setOpen(false);
    setLocation("/contacts");
  };

  return (
    <Wrapper>
      <div>
        <Header>
          <Title>{browser.i18n.getMessage("add_new_contact")}</Title>
        </Header>
        <SubTitle>Avatar</SubTitle>
        <PicWrapper>
          {contact.avatarId && contact.profileIcon && (
            <ContactPic src={contact.profileIcon} />
          )}
          {!contact.avatarId && !contact.profileIcon && (
            <AutoContactPic>{generateProfileIcon(contact.name)}</AutoContactPic>
          )}
          <label htmlFor="avatarUpload" style={{ cursor: "pointer" }}>
            <UploadIcon />
          </label>
          <input
            id="avatarUpload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarUpload}
          />
        </PicWrapper>
        <SubTitle>Name*</SubTitle>
        <InputWrapper>
          <ContactInput
            fullWidth
            small
            name="name"
            placeholder={"First and Last name"}
            value={contact.name}
            onChange={handleInputChange}
          />
        </InputWrapper>
        <SubTitle>Arweave Account Address*</SubTitle>
        <InputWrapper>
          <ContactInput
            fullWidth
            small
            name="address"
            placeholder={contact.address ? contact.address : "Account address"}
            value={contact.address}
            onChange={handleInputChange}
          />
        </InputWrapper>
        <SubTitle>ArNS Address</SubTitle>
        <InputWrapper>
          <SelectInput
            fullWidth
            small
            name="ArNSAddress"
            value={contact.ArNSAddress}
            onChange={(e) =>
              setContact({ ...contact, ArNSAddress: e.target.value })
            }
          >
            <option value="">
              {arnsResults.length === 0
                ? "No ArNS address found"
                : "Select ArNS address"}
            </option>
            {Object.entries(arnsResults).map(([contractTxId]) => (
              <option key={contractTxId} value={contractTxId}>
                {contractTxId + ".arweave.ar"}
              </option>
            ))}
          </SelectInput>
        </InputWrapper>
        <SubTitle>Notes</SubTitle>
        <NewContactNotes
          placeholder="Type a message here..."
          value={contact.notes || ""}
          onChange={(e) => setContact({ ...contact, notes: e.target.value })}
        />
      </div>
      <>
        <Footer>
          <Button small fullWidth onClick={saveNewContact}>
            Save new contact
          </Button>
          <RemoveContact
            small
            fullWidth
            secondary
            onClick={() => removeContactModal.setOpen(true)}
          >
            Remove contact
          </RemoveContact>
        </Footer>
        <Modal
          {...removeContactModal.bindings}
          root={document.getElementById("__plasmo")}
        >
          <CenterText heading>Remove contact</CenterText>
          <Spacer y={0.55} />
          <CenterText noMargin>
            Are you sure you want to remove this contact?
          </CenterText>
          <Spacer y={1.75} />
          <Button fullWidth onClick={confirmRemoveContact}>
            Yes
          </Button>
          <Spacer y={0.75} />
          <Button
            fullWidth
            secondary
            onClick={() => removeContactModal.setOpen(false)}
          >
            No
          </Button>
        </Modal>
      </>
    </Wrapper>
  );
}

const NewContactNotes = styled(ContactNotes)`
  height: 235px;
`;
