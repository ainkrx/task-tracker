import * as formStyles from '../styles/formStyles';

function TagForm({ 
  tagForm,
  setTagForm,
  formError,
  editingId,
  onSubmit
}) {
  const handleTagInputChange = (event) => {
    const { name, value } = event.target;
    setTagForm((prev) => ({
      ...prev,
      [name]: value.toLowerCase(),
    }));
  };

  return (
    <form className="bg-white p-8 space-y-4 rounded-lg shadow-md mb-8" onSubmit={onSubmit}>
      <label htmlFor="tagName" className={`mt-3 ${formStyles.labelFormStyle}`}>
        Tag Name
      </label>
      <input
        type="text"
        id="tagName"
        name="name"
        value={tagForm.name}
        onChange={handleTagInputChange}
        placeholder="One word that reminds you of the task"
        required
        className={formStyles.inputFormStyle}
      />
      {formError.name && (
        <span className={formStyles.errorFormStyle}>
          {formError.name}
        </span>
      )}
      <button type="submit" className="w-full py-3 rounded bg-blue-700 hover:bg-blue-900 text-white font-bold cursor-pointer transition">
        {editingId ? 'Update Tag' : 'Add Tag'}
      </button>
    </form>
  );
}

export default TagForm;