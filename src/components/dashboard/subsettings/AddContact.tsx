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
import { getAllArNSNames } from "~lib/arns";
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
          content: browser.i18n.getMessage("uploaded_avatar"),
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

  async function fetchArnsAddresses(ownerAddress) {
    try {
      const arnsNames = await getAllArNSNames(ownerAddress);
      setArnsResults(arnsNames.records || []);
    } catch (error) {
      console.error("Error fetching ArNS addresses:", error);
    }
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

  const areFieldsEmpty = () => {
    return !contact.name || !contact.address;
  };

  return (
    <Wrapper>
      <div>
        <Header>
          <Title>{browser.i18n.getMessage("add_new_contact")}</Title>
        </Header>
        <SubTitle>{browser.i18n.getMessage("contact_avatar")}</SubTitle>
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
        <SubTitle>{browser.i18n.getMessage("name")}*</SubTitle>
        <InputWrapper>
          <ContactInput
            fullWidth
            small
            name="name"
            placeholder={browser.i18n.getMessage("first_last_name")}
            value={contact.name}
            onChange={handleInputChange}
          />
        </InputWrapper>
        <SubTitle>
          {browser.i18n.getMessage("arweave_account_address")}*
        </SubTitle>
        <InputWrapper>
          <ContactInput
            fullWidth
            small
            name="address"
            placeholder={
              contact.address
                ? contact.address
                : browser.i18n.getMessage("account_address")
            }
            value={contact.address}
            onChange={handleInputChange}
          />
        </InputWrapper>
        <SubTitle>{browser.i18n.getMessage("ArNS_address")}</SubTitle>
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
                ? browser.i18n.getMessage("no_ArNS_address_found")
                : browser.i18n.getMessage("select_ArNS_address")}
            </option>
            {Object.entries(arnsResults).map(([contractTxId]) => (
              <option key={contractTxId} value={contractTxId}>
                {browser.i18n.getMessage("arweave_url") + contractTxId}
              </option>
            ))}
          </SelectInput>
        </InputWrapper>
        <SubTitle>{browser.i18n.getMessage("notes")}</SubTitle>
        <NewContactNotes
          placeholder={browser.i18n.getMessage("type_message_here")}
          value={contact.notes || ""}
          onChange={(e) => setContact({ ...contact, notes: e.target.value })}
        />
      </div>
      <>
        <Footer>
          <Button
            small
            fullWidth
            onClick={saveNewContact}
            disabled={areFieldsEmpty()}
          >
            {browser.i18n.getMessage("save_new_contact")}
          </Button>
          <RemoveContact
            small
            fullWidth
            secondary
            onClick={() => removeContactModal.setOpen(true)}
          >
            {browser.i18n.getMessage("remove_contact")}
          </RemoveContact>
        </Footer>
        <Modal
          {...removeContactModal.bindings}
          root={document.getElementById("__plasmo")}
        >
          <CenterText heading>
            {browser.i18n.getMessage("remove_contact")}
          </CenterText>
          <Spacer y={0.55} />
          <CenterText noMargin>
            {browser.i18n.getMessage("remove_contact_question")}
          </CenterText>
          <Spacer y={1.75} />
          <Button fullWidth onClick={confirmRemoveContact}>
            {browser.i18n.getMessage("yes")}
          </Button>
          <Spacer y={0.75} />
          <Button
            fullWidth
            secondary
            onClick={() => removeContactModal.setOpen(false)}
          >
            {browser.i18n.getMessage("no")}
          </Button>
        </Modal>
      </>
    </Wrapper>
  );
}

const NewContactNotes = styled(ContactNotes)`
  height: 235px;
`;
