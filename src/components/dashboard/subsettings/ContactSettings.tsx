import {
  Text,
  Button,
  Input,
  Modal,
  Select,
  Spacer,
  useModal
} from "@arconnect/components";
import { useState, useEffect } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { ExtensionStorage } from "~utils/storage";
import styled from "styled-components";
import browser from "webextension-polyfill";
import { Edit02, Upload01 } from "@untitled-ui/icons-react";
import { useLocation } from "wouter";
import { uploadUserAvatar, getUserAvatar } from "~lib/avatar";
import { useToasts } from "@arconnect/components";
import copy from "copy-to-clipboard";

export default function ContactSettings({ address }: Props) {
  // contacts
  const [storedContacts, setStoredContacts] = useStorage(
    {
      key: "contacts",
      instance: ExtensionStorage
    },
    []
  );

  const { setToast } = useToasts();

  const [editable, setEditable] = useState(false);
  const [contact, setContact] = useState({
    name: "",
    address: "",
    profileIcon: "",
    notes: "",
    ArNSAddress: ""
  });
  const [contactIndex, setContactIndex] = useState(-1);
  const [arnsResults, setArnsResults] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  useEffect(() => {
    const loadedContact = storedContacts.find((c) => c.address === address);
    if (loadedContact) {
      setContact(loadedContact);
      setContactIndex(storedContacts.indexOf(loadedContact));
      fetchArnsAddresses(loadedContact.address);
    } else {
      setContact({
        name: "",
        address: "",
        profileIcon: "",
        notes: "",
        ArNSAddress: ""
      });
      setContactIndex(-1);
    }
  }, [storedContacts, address]);

  async function fetchArnsAddresses(ownerAddress) {
    const arnsNames = await getAllArNSNames(ownerAddress);
    setArnsResults(arnsNames.records || []);
  }

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContact({
      ...contact,
      [name]: value
    });
  };

  const saveContact = async () => {
    if (contactIndex !== -1) {
      const updatedContacts = [...storedContacts];
      updatedContacts[contactIndex] = contact;
      try {
        await ExtensionStorage.set("contacts", updatedContacts);
      } catch (error) {
        console.error("Error updating contacts:", error);
      }
    }

    setEditable(false);
  };

  // generate profile icon from the first name
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
        setSelectedAvatar(avatarTxId);
      } catch (error) {
        console.error("Error uploading avatar:", error);
      }
    }
  };

  useEffect(() => {
    if (selectedAvatar) {
      getUserAvatar(selectedAvatar)
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
  }, [selectedAvatar]);

  const renderArNSAddress = () => {
    if (editable) {
      return (
        <>
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
        </>
      );
    } else if (contact.ArNSAddress) {
      return (
        <>
          <SubTitle>ArNS Address</SubTitle>
          <ContactInfo>{contact.ArNSAddress + ".arweave.ar"}</ContactInfo>
        </>
      );
    }
  };

  const [, setLocation] = useLocation();

  const removeContactModal = useModal();

  const confirmRemoveContact = async () => {
    // remove contact & update storage
    if (contactIndex !== -1) {
      const updatedContacts = [...storedContacts];
      updatedContacts.splice(contactIndex, 1);
      try {
        await ExtensionStorage.set("contacts", updatedContacts);
        console.log("Contact removed succcessfully");
      } catch (error) {
        console.error("Error removing contact:", error);
      }
    }

    removeContactModal.setOpen(false);
    setLocation("/contacts");
  };

  return (
    <Wrapper>
      <div>
        <Header>
          <Title>{browser.i18n.getMessage("contact_info")}</Title>
          <EditIcon onClick={() => setEditable(!editable)} />
        </Header>
        <SubTitle>Avatar</SubTitle>
        <PicWrapper>
          {contact.profileIcon && <ContactPic src={contact.profileIcon} />}
          {!contact.profileIcon && (
            <AutoContactPic>{generateProfileIcon(contact.name)}</AutoContactPic>
          )}
          {editable ? (
            <>
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
            </>
          ) : null}
        </PicWrapper>
        <SubTitle>Name*</SubTitle>
        {editable ? (
          <InputWrapper>
            <ContactInput
              fullWidth
              small
              name="name"
              placeholder={contact.name ? contact.name : "First and Last name"}
              value={contact.name}
              onChange={handleInputChange}
            />
          </InputWrapper>
        ) : (
          <ContactInfo>{contact.name}</ContactInfo>
        )}
        <SubTitle>Arweave Account Address*</SubTitle>
        {editable ? (
          <InputWrapper>
            <ContactInput
              fullWidth
              small
              name="address"
              placeholder={
                contact.address ? contact.address : "Account address"
              }
              value={contact.address}
              onChange={handleInputChange}
            />
          </InputWrapper>
        ) : (
          <ContactInfo>{contact.address}</ContactInfo>
        )}
        {<>{renderArNSAddress()}</>}
        <SubTitle>Notes</SubTitle>
        <ContactNotes
          placeholder="Type a message here..."
          value={contact.notes || ""}
          onChange={(e) => setContact({ ...contact, notes: e.target.value })}
          style={{ height: editable ? "235px" : "269px" }}
        />
      </div>
      {editable && (
        <>
          <Footer>
            <Button small fullWidth onClick={saveContact}>
              Save changes
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
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
`;

const CenterText = styled(Text)`
  text-align: center;
  max-width: 22vw;
  margin: 0 auto;

  @media screen and (max-width: 720px) {
    max-width: 90vw;
  }
`;

const PicWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UploadIcon = styled(Upload01)`
  cursor: pointer;
`;

const EditIcon = styled(Edit02)`
  cursor: pointer;
`;

const RemoveContact = styled(Button)`
  background-color: #ea433580;
  color: #ea4335;
  border: 2px solid #ea433580;
  transition: all 0.29s ease-in-out;
  height: 46.79px;

  &:hover {
    transform: scale(1.02);
  }
`;

const AutoContactPic = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 100%;
  margin-bottom: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  font-size: 44px;
  background-color: #ab9aff26;
`;

const ContactPic = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 100%;
  margin-bottom: 10px;
`;

const InputWrapper = styled.div`
  margin-bottom: 10px;
`;

const SelectInput = styled(Select)`
  height: 53px;
  padding: 10px 20px 10px 20px;
  color: #b9b9b9;
  font-size: 16px;
  ::placeholder {
    color: #b9b9b9;
    font-size: 16px;
  }
`;

const ContactInput = styled(Input)`
  height: 33px;
  padding: 10px 20px 10px 20px;
  color: #b9b9b9;
  font-size: 16px;
  ::placeholder {
    color: #b9b9b9;
    font-size: 16px;
  }
`;

const ContactInfo = styled(Text).attrs({
  heading: true
})`
  margin-bottom: 20px;
  font-weight: 500;
  display: flex;
  flex-wrap: wrap;
`;

const ContactNotes = styled.textarea`
  display: flex;
  width: 96%;
  border-radius: 15px;
  border: 1.5px solid #ab9aff26;
  padding: 12px;
  background-color: #ab9aff26;
  font-size: 16px;
  ::placeholder {
    color: #b9b9b9;
    font-size: 16px;
  }
  &:focus {
    outline: none;
  }
  caret-color: #b9b9b9;
  color: #b9b9b9;
`;

const SubTitle = styled(Text)`
  font-size: 16px;
  color: #aeadcd;
  margin-bottom: 4px;
`;

const Title = styled(Text).attrs({
  title: true
})`
  font-weight: 600;
  margin-bottom: 10px;
`;

interface Props {
  address: string;
}
