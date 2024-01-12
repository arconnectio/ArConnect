import {
  Text,
  Button,
  Input,
  Modal,
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

export default function ContactSettings({ address }: Props) {
  // contacts
  const [storedContacts, setStoredContacts] = useStorage(
    {
      key: "contacts",
      instance: ExtensionStorage
    },
    []
  );

  const [editable, setEditable] = useState(false);
  const [contact, setContact] = useState({
    name: "",
    address: "",
    profileIcon: "",
    notes: "",
    ArNSAddress: ""
  });
  const [contactIndex, setContactIndex] = useState(-1);

  useEffect(() => {
    const loadedContact = storedContacts.find((c) => c.address === address);

    if (loadedContact) {
      setContact(loadedContact);
      setContactIndex(storedContacts.indexOf(loadedContact));
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

  const renderArNSAddress = () => {
    if (editable) {
      return (
        <>
          <SubTitle>ArNS Address</SubTitle>
          <InputWrapper>
            <ContactInput
              fullWidth
              small
              name="ArNSAddress"
              placeholder={
                contact.ArNSAddress ? contact.ArNSAddress : "Account address"
              }
              value={contact.ArNSAddress}
              onChange={handleInputChange}
            />
          </InputWrapper>
        </>
      );
    } else if (contact.ArNSAddress) {
      return (
        <>
          <SubTitle>ArNS Address</SubTitle>
          <ContactInfo>{contact.ArNSAddress}</ContactInfo>
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
          <ContactPic src={contact.profileIcon} />
          {editable ? <UploadIcon /> : null}
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

const ContactPic = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 100%;
  margin-bottom: 10px;
`;

const InputWrapper = styled.div`
  margin-bottom: 10px;
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
